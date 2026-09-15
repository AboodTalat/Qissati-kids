# The AI pipeline

The manual production pipeline, run in order — **approved concept → story JSON
→ human review → parent text approval → character reference sheets → one
illustration per page → assembly** — plus the print spec the prompts are written against. There is no
AI API integration: the dashboard prepares and validates the work, and the
operator runs the prompts in the external tools themselves.

> **The prompts themselves are not in this file.** They live in
> [`lib/prompts.js`](../lib/prompts.js), because there they are filled from a
> real order instead of retyped by hand, and the dashboard hands them over
> ready to paste. This file is the *why*: what the pipeline is, what the
> printed book demands of it, and the decisions that are easy to undo by
> accident.
>
> To read an actual prompt, open any order at `/admin` and press
> **شوفوا البرومبت**. That is the real text, for a real child, every time.

## Where it runs

| Step | Tool | What it produces |
|---|---|---|
| 1. Story text | **Google Gemini** (short / medium / long text per page) | The whole book as JSON — title, parent-facing summary, dedication, the text of every page, a scene description for every page and the cover, and the character briefs |
| 2. Paste and validation | **the dashboard** | Rejects missing fields, wrong page counts or numbering, empty text/art descriptions and pages outside the chosen word range |
| 3. Human review | **the Qissati operator** | Confirms the facts, language, personalisation, safety and visual continuity before any art prompt unlocks |
| 4. Parent text approval | **the dashboard** | A branded A4 PDF containing only the title, summary, dedication and page-by-page story text, identified by a stable proof code |
| 5. Character sheets | **Nano Banana Pro** | The main child from the parent's photographs, plus a separate reference sheet for every recurring sibling, friend or pet |
| 6. Page art | **Nano Banana Pro**, with the approved sheets attached every time | One square illustration per page, plus the cover |
| 7. Assembly and preflight | **the dashboard**, `components/admin/BookStudio.jsx` | Drop each illustration into its page, fix the words, complete the final checklist, export |

**Pick the page length before you run step 1.** نص قصير is one sentence a page
for a child who is being read to; نص متوسط is the default; نص طويل is four to
six sentences for a child reading it themselves. It is not just a word count —
it changes the reading level *and* how much of each illustration the text will
cover, and that second part is written into both the scene descriptions and the
image prompts so the two agree.

The dashboard's **برومبتات الذكاء الاصطناعي** panel presents six gated steps.
The operator must confirm that the concept was agreed with the parent before
the story prompt unlocks. Step 1's JSON is the hub: the character sheets need
the appearance briefs and every page prompt needs that page's scene. The
operator pastes Gemini's answer back into the panel, completes the human review,
downloads the parent-facing story proof, records approval of its exact proof
code, then generates and approves the reference sheets before page prompts
unlock.

`lib/story-proof.js` builds that approval file locally in the browser. Arabic
is painted on canvas with the loaded Cairo font so shaping and full tashkeel
survive, then each A4 page is embedded into the PDF. The file intentionally
contains no contact details, raw JSON, character briefs, illustration
descriptions, prompts or internal notes. Its stable `SP-…` code hashes only the
parent-facing title, summary, dedication and page text: changing any approved
word creates a different code and invalidates the dashboard's approval gate,
while changing an internal scene description does not pretend the parent
approved something they were never shown.

**If Gemini's answer will not parse, the panel repairs the usual causes before
complaining** — unescaped quotes around Arabic dialogue, and raw line breaks —
and tells you when it had to. If it truly cannot, it shows the line and column
and the offending line itself rather than just "invalid JSON". A syntactically
valid object still does not pass unless it has the title, dedication, character
briefs, cover scene, exact ordered page count, sequential page numbers, text and
art description on every page, and the chosen word range on every page. Until
all of those pass, no character or page-art prompt is available.
Inside text values the prompt asks for «» or “” and reserves straight `"` for
JSON's own delimiters, avoiding the most common quoting failure at its source.

The story brief asks for **publication-ready children's writing**, not a usable
first draft: the model silently plans and revises the complete arc, keeps every
beat causally connected, uses precise natural language and purposeful sensory
detail, and removes filler, clichés, repetitive phrasing and decorative lines
that do not advance action or deepen character. The page-length limits still
apply; polish cannot be bought by overflowing the printed page.

The arc is now planned against the order's **exact page count**, rather than a
generic beginning/middle/end instruction. Page 1 opens on the child's active
desire and plants a useful personal detail; page 2 creates the central story
question; the middle pages contain distinct attempts, consequences and a real
turn; the third-to-last page is the child-led decisive action; the penultimate
page shows its concrete consequence; and the final page is reserved for a warm
emotional landing that echoes the opening. The prompt also requires a
BECAUSE/THEREFORE chain, setup before payoff, and continuity of place, time,
knowledge, objects and emotion across page boundaries. It silently
reverse-outlines the finished draft and rewrites any decorative, repeated,
contradictory or disconnected page before returning JSON.

**A clue has to exist before the story can follow it.** Any trail, footprint,
drop, crumb, mark or damaged object is shown being created in the reader-facing
page text before it becomes evidence: wet paws can leave prints on the next
pages; unexplained prints cannot simply appear when the chase needs them. The
illustration description visualises the same beat but may never contain the
only explanation for why the following page happens.

Plot-critical vocabulary receives an additional age-comprehension pass. For a
four-year-old, the action is carried by everyday nouns and verbs. A culturally
specific word can still add the real texture of Jordan — it is introduced with
a familiar category, use or visible quality in the same sentence, such as “red
spice called sumac.” The parent should not have to interrupt the story to
explain the word that makes its logic work. Agency follows the same age rule:
a young child can make the observation and decisive choice in a public setting
while a trusted adult remains nearby and aware.

Generic praise is not accepted as plot. “He proved he was a hero” has to become
the observable choice that earns the feeling. The final page has its own
rejection test: it cannot list roles or traits, announce a lesson, summarise the
adventure or tease a generic next one. It closes on one quiet present-moment
image or interaction that gives an opening detail new meaning. The summary and
dedication follow the same rule instead of falling back on “hero,” “star” or
“you can do anything.”

The title is part of that personalisation rather than a label added afterward.
It must contain the child's name in the story's chosen script and spelling,
then a concise, distinctive phrase describing the central adventure, goal,
problem, object or setting. A generic title that would still work after swapping
the child's name — “X's Adventure”, “Brave X”, “X's Magical Journey” — does not
pass the brief.

Age and text length solve different problems. `ageWritingSpec()` selects real
editorial direction for ages 0–3, 4–6, 7–9, 10–12 and 13+: vocabulary, syntax,
dialogue, conflict, inference and emotional depth mature with the child. The
operator's short / medium / long choice still controls sentence and word count.
That means an older child can receive concise but unpatronising prose, rather
than getting babyish writing or text that overflows the page.

For either Arabic option, every reader-facing field — the **title, summary,
dedication and every page's text, including names inside them** — must carry full,
linguistically correct tashkeel. This includes shadda, sukun and tanwin where
appropriate. The English character briefs and illustration descriptions stay
English, and Jordanian colloquial is vocalised for its intended spoken
pronunciation rather than being pulled into Modern Standard Arabic case
endings.

That paste is **not stored**. It changes on every re-run, it is not ours to
keep beyond the order itself, and the dashboard's views are state rather than
routes — so leaving the order and coming back clears it. Re-pasting costs one
`Cmd+V`; a stale story quietly generating last week's page 7 costs a reprint.
The operator keeps the approved response as `story-approved.json` in a local
folder named after the order reference; it is the canonical copy if work spans
more than one session.

## The book is edited and exported in the dashboard, not in Word

`BookStudio` is where the book gets made: each page is a row where you drop the
illustration and fix the words on it, then one button gives you the file.
**Gemini's text is a starting point, not the finished book** — a phrase that
reads awkwardly, a line too long for the page, a change the parent asked for
after seeing a draft.

Each page carries its own text box and its own look — **the cover included**:
where the words sit (**فوق / بالنص / تحت / بلا نص**), a millimetre nudge up or
down from there for the illustration that needs the words clear of a face (the
nudge moves the words only; their background stays anchored), what sits behind
them (**تدرّج** fades all the way to flat colour so the words sit on
paint; **غشاوة** stays translucent so the artwork reads through it — which is
what a cover title wants; **لون كامل**; or nothing), the band and text colours
from the brand palette, a size and an alignment.

The cover's text box is the book's **title**, and the title page reads the same
value, so the two can never disagree. **بالنص** exists because the illustration
decides this — a scene whose action fills the bottom of the frame has nowhere
for words down there — and **بلا نص** is a real choice for a page that carries
its part of the story in the picture alone. One button pushes a page's look onto
all the others. Story pages can be reordered.

Story pages carry a small modern circular folio at the bottom centre. Arabic
books use Arabic-Indic digits and English books use Latin digits. The number is
derived from the current story-page order, so reordering immediately renumbers
the sequence. Covers, title/gift/dedication pages and saddle-stitch blank halves
never receive a number. An **إظهار / إخفاء** control persists per order and
drives the preview, PDF and Word together; hiding the folios also releases the
space reserved beneath bottom-positioned text. `BookPage` and `paintPage` draw
the same folio so the dashboard, PDF and flattened Word output stay identical.

**The title, gift and dedication pages take a background as well** — a brand
colour, or a full-bleed photograph with a band behind the words to keep them
readable. They are not part of the "load all the illustrations" sequence: each
one has its own picker, so adding a background never shifts a story page's
image.

**Both Word files are retired**, for reasons that are not preferences:

- **Word silently re-compresses images to 220 ppi.** There is no warning and no
  visible sign until the book is printed, and it is the default.
- **A hand-made imposition cannot compensate for creep.** On a saddle-stitched
  book the inner leaves push outward and are trimmed more, so their content has
  to shift toward the spine — progressively, page by page. Every printer's RIP
  does this; a Word file cannot. Hand the printer **reading-order pages** and
  let them impose.
- Word has no concept of bleed, and cannot emit crop marks or CMYK.

It produces two genuinely different documents, chosen with a toggle and
defaulted from the order's own format:

| | Page size | Bleed | Blanks | Text |
|---|---|---|---|---|
| **نسخة PDF للأهل** | 220 × 220 mm | none | none | live, vector |
| **ملف الطباعة (Word)** | 226 × 226 mm | 3 mm all round | none in reading order; imposed sheets only are padded | flattened into the page |

**The print file can come out as imposed sheets** — 446 × 226 mm, two pages a
side, folded and stapled — because Qissati's print partner asks for them. The
arrangement uses standard 2-up saddle-stitch pairing, mirrored for the binding
direction. On its first outside face an Arabic book shows page 1/front
cover on the left and the back cover on the right; English mirrors that. Each
half loses its inner bleed so the fold does not print a doubled band of artwork
down the middle. **The one thing it cannot do is
creep**: the inner leaves of a stapled book push outward and are trimmed more,
so their content should shift toward the spine, and only a RIP does that. At
12–16 pages the push-out is under a millimetre. For a thicker book, hand the
printer reading-order pages and let them impose.

The toggle drives both export buttons, so the PDF and the Word file always
describe the same object.

**Direction follows the approved story, not a potentially stale order answer.**
`storyDirection()` counts Arabic and Latin-script characters across the pasted
title, summary, dedication and page text. Arabic copy produces a right-bound
RTL book even if a marketing/test order was accidentally entered as English.
The order language is only a fallback for empty/neutral copy, and the editor
offers an explicit Arabic RTL / English LTR override beside the page controls.

> **Tell the printer: duplex with the flip on the SHORT edge** (a vertical
> flip). The imposition is only correct under that flip; long-edge duplexing
> lands every back face upside down and the collated book is nonsense, and
> nothing in the file can tell them which was used. The page order itself is
> verified by simulating the fold — assemble the leaves from the imposition and
> read them back — and it comes out 1…N for 4, 8, 12, 16, 20 and 32 pages in
> both directions. The exported sheets are already imposed: print them at
> **Actual size / 100%** and never select Booklet/imposition a second time.

**Every page of the Word file is one flattened image**, artwork and words baked
together. Word renders text in whatever font the opening machine has, and Cairo
is not installed on a print shop's PC — a substitute font reflows the page and
the book that arrives is not the book that was approved. A flattened page cannot
reflow, cannot lose its font, and cannot be nudged two millimetres by accident.

The images go in at full resolution, because *we* write the file. Word's 220 ppi
re-compression happens when Word **saves**, not when it reads. So: **send the
file as it comes out. Do not open it in Word and re-save it.**

The export buttons are gated. Every cover/story image must be present and have
finished measuring, and the operator must confirm the copy, character
continuity, absence of generated text/watermarks, safe placement, page order and
document mode. Anything below 300 dpi raises a persistent warning but does not
block an intentional export. Print export also requires confirmation that the
parent approved the final PDF proof.

Saddle stitch still folds in fours, so a 14-page book physically needs two
blank halves. `padForSaddleStitch` adds those only inside the imposed-sheet
path. A normal reading-order PDF or Word file ends directly on the back cover;
it never exposes the production filler as two empty ending pages.

The back cover is a real editable page, not a placeholder: it carries the
Qissati logo and wordmark, followed by client-facing copy that starts
personalised with the child's name and explains what Qissati creates. The
operator can rewrite that copy per client; the logo and wordmark remain fixed.

The illustrations are read straight off the operator's disk with
`URL.createObjectURL` and are **never uploaded**, so the finished artwork never
leaves the machine it was downloaded to. The panel warns when the sharpest
illustration works out below **300 dpi** at the printed size — the one thing
about an image you cannot judge by looking at it on screen.

Your edits are kept in the browser, per order, so closing the tab does not cost
an hour of typing. The illustrations are not kept — they are files on your disk,
and you re-pick them if you come back tomorrow.

In Chrome's print dialog: destination **Save as PDF**, margins **None**, and
**Background graphics** on — without it every page prints white.

## The printed page, which is what the image prompts are written against

Taken from the production files (`Layan-storybook-poster-style.docx`,
`Layan-saddle-stitch-imposition.docx`), not from preference:

- **Interior pages are square** — 21.59 × 21.59 cm as the files stand, which is
  8.5 inches. Every illustration is therefore **1:1**. The 43.17 × 21.59 sheet
  in the imposition file is two square pages side by side for saddle stitch; it
  never reaches an image prompt.
- **Poster style.** The artwork is a full-bleed page background. The real story
  scrim starts at 26% and grows with the words, so short/medium prompts reserve
  the bottom 30%; long prompts reserve the bottom 40%. Faces, hands, feet and
  important objects stay above that production-safe area.
- **The cover is the exception**: its veil occupies the upper 40%, so that full
  area stays calm, uncluttered and low in contrast for the title.
- **Trim.** Saddle stitch cuts the edges, so the prompts ask for everything that
  matters to stay inside the middle 90% of the square.
- **Resolution.** 22 cm at 300 dpi is ~2600 px. The prompts ask for Nano Banana
  Pro's **4K** output; its default is well under what the printer needs.

Three things about the print files that are worth settling with the printer,
and that nothing in the code depends on:

1. **21.59 cm is an inch measurement** that came from a Letter-width page
   setup. Every printer in Amman quotes metric; real 22 × 22 cm is one
   page-setup change away.
2. **The imposition is 12 pages, but the order form sells 8 / 10 / 12.** Saddle
   stitch folds in multiples of four *including* covers, so a 10-page story
   does not impose. Check this before that option sells.
3. The placeholder images in the imposition file are **850 × 850 px**, which is
   100 dpi at that size. They are placeholders; the real art has to come out at
   4K.

The Word file also set the story text in an **opaque white rectangle floating at
76% of the page height**, with 3.9 cm of artwork still visible below it. That is
not what `BookPrint` does and not what the image prompts describe: the text now
sits on a **cream scrim flush to the bottom edge**, fading up out of the
artwork over the bottom 26%. CLAUDE.md's own rule is that text over artwork gets
a gradient — a hard white box on a painted illustration is the detail that makes
a book look assembled rather than made.

## The locked art style

`STYLE_DNA` in `lib/prompts.js` is **one constant, repeated word for word in
every image prompt.** That repetition is the only thing making a dozen
independently generated images look like one book, so it is not a place to
improvise.

It was written from the real sample artwork in `public/samples/` — deep teal
grounds, warm gold light with a believable source rather than flat overhead
light, cream highlights, berry accents, painterly brushwork with paper grain,
no line art. The source varies naturally — daylight, a window, lamp, moon or a
story object that genuinely glows — so the book does not repeat the same visual
trick on every page. It was written to *describe*
`cover.jpg` and `spread-shoes.jpg`; nothing has yet been generated from it, so
the first book through this pipeline is also the test of it. It also carries the brand palette rule (teal + gold
+ berry, never blue+orange or blue+pink), so the printed book and the website
read as one product.

Earlier drafts of this file specified *"warm watercolor, soft lines, pastel
palette"*. That was a placeholder and it does not describe the samples at all —
pastel washes are light and flat where the real book is deep and lit. Do not
put it back.

**Changing `STYLE_DNA` changes the look of every future book.** That is why it
is a constant in a reviewed file and not a text box in the dashboard.

## What the prompts do and do not contain

Every field on the order form fills a placeholder in step 1 or step 2 — the
mapping is in [`CLAUDE.md`](../CLAUDE.md) → "The order page". Three deliberate
exclusions:

- **Nothing from `order.contact` ever reaches a prompt.** The parent's name,
  their phone number and their notes to us are not story material, and these
  prompts get pasted into third-party web apps. `briefText()` in `lib/admin.js`
  carries those, because that one is for the team.
- **`occasion` fills no placeholder.** It says what the book is *for*, which
  shapes the gift page and would key a future birthday reminder. It is not a
  story input.
- **`giftMessage` is typeset, not generated.** It is the buyer's own words on a
  printed page.

Two fields carry more weight than their size suggests:

- **`quirk` is the spine of the whole book.** The prompt makes it appear at a
  minimum of two points and be part of how the child succeeds. It is the single
  thing separating a personalised story from a template with a name swapped in.
- **`avoid` is a hard exclusion**, and the prompt says out loud why it is
  usually there — a pet that died, someone no longer in the child's life, a
  fear nobody has named to them. It must be worked around *silently*, in the
  page text and in the scene descriptions. It is deliberately not repeated to
  the image model; see the reasoning below.

## `wantsAvatar: no` — the main-child sheet is skipped

That parent asked for a story **without** their child's likeness, and no
photographs were ever collected. There is nothing to build a sheet from.

What holds the character together instead is `character_brief` in the story
JSON, which in this branch is asked to be a *complete* description — hair,
eyes, colouring, build, outfit — because it is the only description that
exists. `pagePrompts()` then repeats it verbatim on every page in place of "the
attached reference sheet".

The dashboard panel says so rather than showing an empty main-child step, so
nobody goes looking for photographs that were never asked for. A recurring
supporting character still gets their own sheet from the approved
`supporting_character_brief`.

## Why the reference sheet exists at all

The raw photographs are attached **once**, when the main-child sheet is made,
and never again. Two
reasons, and both matter:

- One stylised sheet gives a far steadier likeness across a dozen generations
  than the same three photographs re-interpreted a dozen times.
- A real child's photographs are handed to a third-party image model exactly
  once instead of twelve times.

A sibling, friend or pet gets a separate sheet made from the approved
supporting-character brief. For a pet, the order form collects a required
parent-authored description covering species/type, colour or breed and
distinctive markings. The story prompt uses that stored answer directly; only
a legacy order predating the field asks the operator for a local fallback. The
model is not allowed to infer any of those details from the pet's name.

## Local order folder

The dashboard remains deliberately unintegrated, so the operator keeps a small
local production folder per order:

```text
QIS-REFERENCE/
  story/story-approved.json
  characters/child-approved.png
  characters/sidekick-approved.png
  art/cover-v1.png
  art/page-01-v1.png
  proof/
  final/
```

Generated filenames carry no reliable order, and regenerating one page changes
its download time. Rename approved files as they are accepted rather than using
the provider's random names as production identity.

## Scene descriptions are English, and self-contained

`illustration_description` is written in English even for an Arabic book,
because it is fed to an image model rather than read by anyone.

Each one has to describe its scene from scratch. The pages are generated in
separate, independent calls, so *"the same room as page 3"* describes nothing
at all — and that is the failure mode that produces a book where every bedroom
is a different bedroom.

## Two decisions that look like omissions

**`avoid` is not repeated in the image prompts.** It belongs to the story
prompt, where a text model reliably honours a prohibition — and the scene
descriptions were already written under it, so by the time an image prompt is
built there is nothing left to exclude. Naming the thing to an image model does
the opposite of what it looks like: negation is where these models are weakest,
and it puts the word into a prompt that did not previously contain it.

**Names are only handed over verbatim when the scripts already agree.** The
form's locale and the story's language are separate answers, so a parent
reading the English page can order an Arabic book and type "Layan". Told to
write it "exactly like this", Gemini puts Latin letters into an Arabic
children's book — and the reverse happens just as easily. When the scripts
disagree, `spellingRule()` asks for one transliteration reused everywhere: the
pages, the title and the dedication. A book that spells a child's own name two
ways is worse than one that spells it unexpectedly.
