# -*- coding: utf-8 -*-
"""Rebuild output/pdf/qissati-marketing-reels-playbook.pdf from reels.md.

    python3 docs/marketing/build-pdf.py

Markdown -> designed RTL HTML -> PDF via headless Chrome (the only engine on
this machine that shapes Arabic correctly), rendered twice so the table of
contents can carry real page numbers, then a folio pass and recompression in
PyMuPDF.

Needs: Google Chrome, and `pip3 install --user pymupdf`. Cairo — the site's own
typeface — is downloaded next to this script on first run and is gitignored.

Page numbers are found by stamping a white ASCII marker beside every heading and
reading it back out of pass 1: Arabic extracts as presentation forms, so matching
on the heading text itself is not reliable. The marker must be white rather than
opacity:0 — Chrome omits fully transparent text from the PDF text layer.
"""
import io, os, re, html, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC  = os.path.join(HERE, "reels.md")
FONT = os.path.join(HERE, ".cairo-font.ttf")
FONT_URL = ("https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/"
            "Cairo%5Bslnt%2Cwght%5D.ttf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP_PARENT = os.path.join(REPO, "tmp", "pdfs")
OUT_DIR = os.path.join(REPO, "output", "pdf")
os.makedirs(TMP_PARENT, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)
TMP = tempfile.mkdtemp(prefix="qissati-marketing-", dir=TMP_PARENT)

# ── inline markdown ────────────────────────────────────────────────────────
def inline(t):
    t = html.escape(t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"`([^`]+)`", r'<code>\1</code>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", t)
    return t

NUMHEAD = re.compile(r"^(\d+(?:\.\d+)?\)?)(\s*)")
def head_html(txt):
    """Isolate a leading section number so RTL bidi can't detach its bracket."""
    m = NUMHEAD.match(txt)
    if not m: return inline(txt)
    return '<bdi class="hn">%s</bdi> %s' % (html.escape(m.group(1)), inline(txt[m.end():]))

def cells(line):
    line = line.strip()
    if line.startswith("|"): line = line[1:]
    if line.endswith("|"): line = line[:-1]
    return [c.strip() for c in line.split("|")]

class Doc:
    def __init__(self):
        self.out = []          # html chunks
        self.toc = []          # (level, text, marker)
        self.n = 0
    def mark(self, level, text):
        self.n += 1
        m = "SEC%03d" % self.n
        self.toc.append((level, text, m))
        return '<span class="mk">%s</span>' % m

def convert(md, doc):
    lines = md.split("\n")
    i, out = 0, doc.out
    listtype = None
    def closelist():
        nonlocal listtype
        if listtype: out.append("</%s>" % listtype); listtype = None

    while i < len(lines):
        ln = lines[i]

        # fenced code
        if ln.startswith("```"):
            closelist(); i += 1; buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(html.escape(lines[i])); i += 1
            i += 1
            out.append('<pre class="flow">%s</pre>' % "\n".join(buf))
            continue

        # table
        if ln.strip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i+1]):
            closelist()
            head = cells(ln); i += 2; rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(cells(lines[i])); i += 1
            cls = "timeline" if (head and head[0] in ("الوقت",)) else "grid"
            t = ['<table class="%s"><thead><tr>' % cls]
            t += ["<th>%s</th>" % inline(c) for c in head]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in r) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue

        # blockquote (may contain its own heading / list)
        if ln.startswith(">"):
            closelist(); buf = []
            while i < len(lines) and (lines[i].startswith(">") or (buf and lines[i].strip() == "" and i+1 < len(lines) and lines[i+1].startswith(">"))):
                buf.append(re.sub(r"^>\s?", "", lines[i])); i += 1
            inner = "\n".join(buf)
            warn = ("⚠️" in inner or "⛔" in inner)
            sub = Doc(); convert(inner, sub)
            out.append('<div class="quote%s">%s</div>' % (" warn" if warn else "", "".join(sub.out)))
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)$", ln)
        if m:
            closelist()
            lvl, txt = len(m.group(1)), m.group(2).strip()
            if lvl == 1:
                out.append("<h1>%s</h1>" % inline(txt))
            elif lvl == 2:
                out.append('<h2 class="sec">%s%s</h2>' % (doc.mark(2, txt), head_html(txt)))
            elif lvl == 3:
                out.append('<h3>%s%s</h3>' % (doc.mark(3, txt), head_html(txt)))
            else:
                out.append("<h4>%s</h4>" % inline(txt))
            i += 1; continue

        # hr
        if re.match(r"^-{3,}$", ln.strip()):
            closelist(); out.append('<hr>'); i += 1; continue

        # list items
        m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", ln)
        if m:
            want = "ol" if re.match(r"\d+\.", m.group(2)) else "ul"
            body = m.group(3)
            box = ""
            if body.startswith("[ ] "):
                box, body = '<span class="box"></span>', body[4:]
            if listtype and listtype != want: closelist()
            if not listtype:
                out.append("<%s>" % want); listtype = want
            j = i + 1; cont = [body]
            while j < len(lines) and lines[j].startswith("  ") and lines[j].strip() and not re.match(r"^(\s*)([-*]|\d+\.)\s+", lines[j]):
                cont.append(lines[j].strip()); j += 1
            i = j
            out.append("<li>%s%s</li>" % (box, inline(" ".join(cont))))
            continue

        if ln.strip() == "":
            closelist(); i += 1; continue

        # paragraph
        closelist(); buf = [ln]; i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,4}\s|>|\||```|-{3,}$)", lines[i]) \
              and not re.match(r"^(\s*)([-*]|\d+\.)\s+", lines[i]):
            buf.append(lines[i]); i += 1
        out.append("<p>%s</p>" % inline(" ".join(buf)))
    closelist()

CSS = """
@font-face{font-family:Cairo;src:url("FONTURL")format("truetype");font-weight:200 900;}
@page{size:A4;margin:17mm 15mm 20mm 15mm;}
@page cover{size:A4;margin:0;}
*{box-sizing:border-box;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:Cairo,"SF Arabic","Geeza Pro",sans-serif;direction:rtl;text-align:start;
  font-size:9.6pt;line-height:1.85;color:#2e2a26;background:#fff;margin:0;}
h1,h2,h3,h4{line-height:1.5;margin:0;}
code{font-family:"SF Mono",Menlo,monospace;font-size:.86em;direction:ltr;unicode-bidi:isolate;
  background:#f6f1e8;border:1px solid #eadfc9;border-radius:4px;padding:.05em .3em;color:#146466;}
strong{font-weight:800;color:#1a1714;}
a{color:#146466;}
.mk{font-size:2.4px;color:#ffffff;letter-spacing:0;}

/* ── cover ───────────────────────────────────────────── */
.cover{page:cover;position:relative;width:210mm;height:297mm;margin:0;padding:46mm 24mm 24mm 24mm;
  background:linear-gradient(160deg,#1f8a8c 0%,#146466 55%,#0e4a4c 100%);color:#fdf8f0;
  page-break-after:always;display:flex;flex-direction:column;}
.cover .rule{width:52px;height:3px;background:#f4b740;margin-bottom:14mm;}
.cover .brand{font-size:13pt;font-weight:700;color:#f4b740;margin-bottom:3mm;}
.cover h1{font-size:40pt;font-weight:900;line-height:1.25;margin:0 0 6mm;color:#fdf8f0;}
.cover .sub{font-size:13.5pt;font-weight:400;color:#e3f0ef;max-width:120mm;line-height:1.8;}
.cover .stats{margin-top:auto;display:flex;gap:14mm;padding-bottom:9mm;}
.cover .stats div{display:flex;flex-direction:column;}
.cover .stats b{font-size:24pt;font-weight:900;color:#f4b740;line-height:1.1;}
.cover .stats span{font-size:9pt;color:#cfe3e2;}
.cover .foot{border-top:1px solid rgba(253,248,240,.28);padding-top:6mm;
  font-size:9pt;color:#cfe3e2;display:flex;justify-content:space-between;}
.cover .warnbox{margin-top:12mm;border-inline-start:3px solid #f4b740;padding:2mm 5mm;
  font-size:10pt;color:#f6e8cd;max-width:125mm;}

.intro{page-break-after:always;}
.intro h2{font-size:19pt;font-weight:900;color:#146466;margin-bottom:5mm;}
.intro p{font-size:10.5pt;line-height:2;max-width:150mm;}
.intro .quote{margin-top:6mm;}
.kick{font-size:9pt;font-weight:700;color:#9c3d5b;border-top:2px solid #f4b740;
  display:inline-block;padding-top:2mm;margin-bottom:5mm;}

/* ── toc ─────────────────────────────────────────────── */
.toc{page-break-after:always;}
.toc h2{font-size:19pt;font-weight:900;color:#146466;margin-bottom:4mm;}
.hn{font-weight:900;}
.toc .kick{font-size:9pt;font-weight:700;color:#9c3d5b;border-top:2px solid #f4b740;
  display:inline-block;padding-top:2mm;margin-bottom:5mm;}
.toc ol{list-style:none;margin:0;padding:0;}
.toc li{display:flex;align-items:baseline;gap:7px;padding:1.5mm 0;line-height:1.4;
  border-bottom:1px solid #eee6d8;font-size:10pt;}
.toc li.l3{padding-inline-start:8mm;font-size:9pt;color:#4a443d;border-bottom:1px dotted #f2ece0;}
.toc li .t{flex:0 1 auto;}
.toc li .d{flex:1 1 auto;min-width:8mm;border-bottom:1px dotted #d9d0c0;transform:translateY(-3px);}
.toc li .p{flex:0 0 9mm;text-align:start;font-weight:800;color:#146466;font-variant-numeric:tabular-nums;}
.toc li.l3 .p{font-weight:600;color:#7a736a;}

/* ── headings ────────────────────────────────────────── */
h2.sec{page-break-after:avoid;font-size:19pt;font-weight:900;color:#146466;
  border-top:3px solid #f4b740;padding-top:4mm;margin:0 0 6mm;}
h3{page-break-after:avoid;font-size:13.5pt;font-weight:800;color:#9c3d5b;margin:9mm 0 3mm;
  padding-bottom:2mm;border-bottom:1px solid #eadfc9;}
h4{page-break-after:avoid;font-size:10.5pt;font-weight:800;color:#146466;margin:6mm 0 1.5mm;}
p{margin:0 0 3mm;}
hr{border:0;border-top:1px solid #eee6d8;margin:7mm 0;}

/* ── lists ───────────────────────────────────────────── */
ul,ol{margin:0 0 4mm;padding-inline-start:6mm;}
ol{list-style-type:arabic-indic;}
li{margin-bottom:1.6mm;}
li::marker{color:#146466;font-weight:700;}
.box{display:inline-block;width:9px;height:9px;border:1.4px solid #146466;border-radius:2px;
  margin-inline-end:6px;transform:translateY(-1px);}

/* ── quotes / callouts ───────────────────────────────── */
.quote{border-inline-start:3px solid #f4b740;background:#fdfaf3;padding:3.5mm 5mm 1.5mm;
  margin:0 0 5mm;page-break-inside:avoid;font-size:9.3pt;}
.quote p{margin-bottom:2mm;}
.quote.warn{border-inline-start-color:#b84c6e;background:#fdf4f6;}
.quote h3{font-size:11pt;color:#9c3d5b;border:0;margin:0 0 2mm;padding:0;}
.quote h4{margin-top:2mm;}

pre.flow{direction:ltr;text-align:left;font-family:"SF Mono",Menlo,monospace;font-size:7.6pt;
  line-height:1.5;background:#0e4a4c;color:#e3f0ef;padding:5mm;border-radius:6px;overflow:hidden;
  page-break-inside:avoid;margin:0 0 5mm;}

/* ── tables ──────────────────────────────────────────── */
table{width:100%;border-collapse:collapse;margin:0 0 5mm;font-size:8.5pt;line-height:1.65;}
thead{display:table-header-group;}
th{text-align:start;font-weight:800;color:#146466;font-size:8.4pt;padding:2mm 2.5mm;
  border-bottom:2px solid #f4b740;vertical-align:bottom;}
td{padding:2.2mm 2.5mm;border-bottom:1px solid #efe8da;vertical-align:top;}
tr{page-break-inside:avoid;}
tbody tr:nth-child(even){background:#fcfaf5;}
table.timeline td:first-child{white-space:nowrap;font-weight:700;color:#9c3d5b;
  font-variant-numeric:tabular-nums;direction:ltr;text-align:start;width:1%;}
table.timeline th:first-child{width:1%;white-space:nowrap;}
"""

def build_html(md, toc_pages=None):
    doc = Doc()
    body = md.split("\n", 1)[1]          # the H1 becomes the cover
    cut = body.index("\n## ")
    pre, body = body[:cut], body[cut:]
    pre = pre.rstrip().rstrip("-").rstrip()
    predoc = Doc(); convert(pre, predoc)
    intro = ('<section class="intro"><div class="kick">قبل ما تبلّش</div>'
             '<h2>كيف تُقرأ هذه الوثيقة</h2>%s</section>' % "".join(predoc.out))
    convert(body, doc)

    toc_html = ['<section class="toc"><div class="kick">المحتويات</div><h2>شو في بهالدليل</h2><ol>']
    for lvl, txt, mk in doc.toc:
        pg = (toc_pages or {}).get(mk, "")
        toc_html.append('<li class="l%d"><span class="t">%s</span><span class="d"></span><span class="p">%s</span></li>'
                        % (lvl, head_html(txt), pg))
    toc_html.append("</ol></section>")

    cover = """
<section class="cover">
  <div class="rule"></div>
  <div class="brand">قصتي</div>
  <h1>استراتيجية التسويق ودليل الريلز</h1>
  <div class="sub">خطة إطلاق لأول ٩٠ يوماً على إنستغرام وفيسبوك، و١٢ سكربت ريل
  مكتوب ثانية بثانية — مبنية على المنتج، السوق الأردني، وإرشادات Meta الحالية.</div>
  <div class="warnbox"><strong>اقرأ القسم ٠ أول شي.</strong> فيه خمس قرارات لازم تُحسم
  قبل أول ريل — منها السعر ومدة التجهيز، وتصنيف ليان كنموذج توضيحي لا كعميلة.</div>
  <div class="stats">
    <div><b>12</b><span>سكربت ريل</span></div>
    <div><b>2</b><span>منصات Meta</span></div>
    <div><b>90</b><span>يوم إطلاق</span></div>
  </div>
  <div class="foot"><span>وثيقة داخلية — قصتي · الأردن</span><span>١٤ أيلول ٢٠٢٦</span></div>
</section>"""

    return ("<!doctype html><html lang='ar' dir='rtl'><head><meta charset='utf-8'>"
            "<title>قصتي — استراتيجية التسويق ودليل الريلز</title><style>%s</style></head><body>%s%s%s%s</body></html>"
            % (CSS.replace("FONTURL", "file://" + FONT), cover, intro, "".join(toc_html), "".join(doc.out))), doc

def render(html_path, pdf_path):
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    "--print-to-pdf=" + pdf_path, "--virtual-time-budget=20000",
                    "file://" + html_path], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def page_map(pdf_path):
    from pypdf import PdfReader
    r = PdfReader(pdf_path); m = {}
    for idx, page in enumerate(r.pages, start=1):
        try: txt = page.extract_text() or ""
        except Exception: txt = ""
        for mk in re.findall(r"SEC\d{3}", txt):
            m.setdefault(mk, idx)
    return m, len(r.pages)

def shape(t):
    """reportlab draws raw codepoints LTR: Arabic needs joining + bidi first."""
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(t))
    except Exception:
        return t

AR = "٠١٢٣٤٥٦٧٨٩"
def ar_num(n): return "".join(AR[int(c)] for c in str(n))

def stamp(src, dst, total):
    """Running foot + page numbers, then recompress.

    Deliberately Latin-only: neither reportlab nor PyMuPDF's html box shapes
    Arabic (letters come out disconnected and reversed — verified), and the
    overlay is the one layer Chrome does not draw. So the running foot is the
    brand in Latin and the folio in Western digits, matching the Western
    section numbers used through the body.
    """
    import fitz
    d = fitz.open(src)
    for i, page in enumerate(d, start=1):
        if i == 1:
            continue
        W, H = page.rect.width, page.rect.height
        page.draw_line(fitz.Point(42, H - 46), fitz.Point(W - 42, H - 46),
                       color=(.91, .88, .82), width=.5)
        page.insert_text(fitz.Point(W - 42 - fitz.get_text_length(
                             "QISSATI  ·  MARKETING + REELS", "helv", 7),
                             H - 32), "QISSATI  ·  MARKETING + REELS",
                         fontname="helv", fontsize=7, color=(.58, .55, .51))
        page.insert_text(fitz.Point(42, H - 32), "%d / %d" % (i, total),
                         fontname="hebo", fontsize=8, color=(.08, .39, .40))
    d.set_metadata({"title": "قصتي — استراتيجية التسويق ودليل الريلز",
                    "author": "Qissati",
                    "subject": "استراتيجية تسويق 90 يوماً و12 سكربت ريل مكتوب ثانية بثانية",
                    "keywords": "Qissati, reels, Instagram, Facebook, Jordan, marketing"})
    d.set_toc([[1, t, pg] for (t, pg) in TOC_FLAT])
    d.save(dst, garbage=4, deflate=True, clean=True)

TOC_FLAT = []

def main():
    if not os.path.exists(FONT):
        print("downloading Cairo…")
        subprocess.run(["curl", "-sSL", "-o", FONT, FONT_URL], check=True)
    md = io.open(SRC, encoding="utf-8").read()
    h1 = os.path.join(TMP, "pass1.html"); p1 = os.path.join(TMP, "pass1.pdf")
    html1, doc = build_html(md)
    io.open(h1, "w", encoding="utf-8").write(html1)
    render(h1, p1)
    pages, total = page_map(p1)
    print("markers found: %d / %d, pages: %d" % (len(pages), len(doc.toc), total))
    missing = [t for l, t, m in doc.toc if m not in pages]
    if missing: print("MISSING:", missing[:5])
    pretty = {m: str(v) for m, v in pages.items()}
    global TOC_FLAT
    TOC_FLAT = [(re.sub(r"\*\*|`", "", t), pages.get(m, 1)) for l, t, m in doc.toc]
    h2 = os.path.join(TMP, "pass2.html"); p2 = os.path.join(TMP, "pass2.pdf")
    html2, _ = build_html(md, pretty)
    io.open(h2, "w", encoding="utf-8").write(html2)
    render(h2, p2)
    _, total2 = page_map(p2)
    out = os.path.join(OUT_DIR, "qissati-marketing-reels-playbook.pdf")
    stamp(p2, out, total2)
    print("pages:", total2, "->", out, os.path.getsize(out) // 1024, "KB")

main()
