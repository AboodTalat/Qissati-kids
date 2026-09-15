/**
 * Jordan's delivery map: the 12 governorates, and the areas inside each.
 *
 * This exists because "المدينة أو المنطقة" was one free-text box, which is
 * unusable on the receiving end — every parent spells the same place a
 * different way, and a courier cannot be dispatched from "عمان" alone.
 *
 * **The top level is the 12 governorates**, which is the only complete, stable
 * partition of the country. So Russeifa is an area under Zarqa and Ramtha one
 * under Irbid, rather than cities of their own. Any flat "list of cities" is
 * somebody's judgement about which towns are big enough; this one is the
 * official division.
 *
 * **The second level is towns and neighbourhoods, deliberately NOT the ألوية
 * hierarchy.** Two reasons. First, sources disagree on the district structure
 * of the smaller governorates — Ajloun is given as 2 ألوية in one place and 5
 * in another — while the *town* names are consistent everywhere. Second, and
 * decisive: nobody arranging a delivery says "لواء وادي السير", they say
 * "مرج الحمام". The list is what a courier can act on, so each governorate's
 * ألوية centres are in it alongside the towns and (in Amman) the
 * neighbourhoods people actually name.
 *
 * Compiled from the Arabic Wikipedia governorate articles and cross-checked
 * against the English "Districts of Jordan" list, rather than recited from
 * memory — an incorrect district on an Arabic page is something a Jordanian
 * parent spots instantly.
 *
 * **Every slug is globally unique** (`karak-city`, not `city` twice). That is
 * what lets `areaLabel()` be a flat lookup with no governorate argument —
 * which matters because `briefText` in `lib/admin.js` iterates flat field keys
 * and has no city in scope at the point it renders one.
 *
 * **Slugs are stored, labels are displayed** — the same rule as `tone: sweet`
 * → "حنونة". Both lookups fall back to the raw value, because orders placed
 * before this field became a dropdown hold free-typed Arabic.
 *
 * Every list still ends in `أخرى`: this is a delivery *zone*, not an address,
 * and the exact address is arranged in the WhatsApp conversation that follows.
 * No list of a country's towns is ever finished.
 */

const area = (value, ar, en) => ({ value, ar, en });

export const JORDAN_CITIES = [
  // Ordered by population, not alphabetically: a dropdown of 12 is faster to
  // use when the answer most people need is at the top.
  {
    value: "amman",
    ar: "عمّان",
    en: "Amman",
    areas: [
      // West Amman
      area("amman-abdoun", "عبدون", "Abdoun"),
      area("amman-um-uthaina", "أم أذينة", "Umm Uthaina"),
      area("amman-sweifieh", "الصويفية", "Sweifieh"),
      area("amman-rabieh", "الرابية", "Al-Rabieh"),
      area("amman-khalda", "خلدا", "Khalda"),
      area("amman-um-summaq", "أم السماق", "Umm Summaq"),
      area("amman-tlaa-ali", "تلاع العلي", "Tla' Al-Ali"),
      area("amman-deir-ghbar", "دير غبار", "Deir Ghbar"),
      area("amman-dabouq", "دابوق", "Dabouq"),
      area("amman-gardens", "الجاردنز (وصفي التل)", "Gardens (Wasfi Al-Tal)"),
      area("amman-swefieh-hills", "الظهير", "Al-Thuheir"),
      // Central Amman
      area("amman-shmeisani", "الشميساني", "Shmeisani"),
      area("amman-abdali", "العبدلي", "Abdali"),
      area("amman-jabal-amman", "جبل عمّان", "Jabal Amman"),
      area("amman-weibdeh", "جبل اللويبدة", "Jabal Al-Weibdeh"),
      area("amman-jabal-hussein", "جبل الحسين", "Jabal Al-Hussein"),
      area("amman-downtown", "وسط البلد", "Downtown"),
      area("amman-ras-el-ain", "رأس العين", "Ras Al-Ain"),
      area("amman-zahran", "زهران", "Zahran"),
      area("amman-yarmouk", "اليرموك", "Al-Yarmouk"),
      area("amman-basman", "بسمان", "Basman"),
      area("amman-badr", "بدر", "Badr"),
      area("amman-7th-circle", "الدوار السابع", "7th Circle"),
      area("amman-8th-circle", "الدوار الثامن", "8th Circle"),
      // North Amman (لواء الجامعة)
      area("amman-jubeiha", "الجبيهة", "Al-Jubeiha"),
      area("amman-sweileh", "صويلح", "Sweileh"),
      area("amman-shafa-badran", "شفا بدران", "Shafa Badran"),
      area("amman-abu-nseir", "أبو نصير", "Abu Nseir"),
      area("amman-university", "الجامعة", "University District"),
      // East Amman (ماركا)
      area("amman-tabarbour", "طبربور", "Tabarbour"),
      area("amman-marka", "ماركا", "Marka"),
      area("amman-nasr", "النصر", "Al-Nasr"),
      area("amman-tareq", "طارق", "Tareq"),
      area("amman-nuzha", "النزهة", "Al-Nuzha"),
      area("amman-hashmi-shamali", "الهاشمي الشمالي", "Al-Hashmi Al-Shamali"),
      // South-east (القويسمة)
      area("amman-qwaismeh", "القويسمة", "Al-Quwaysimah"),
      area("amman-abu-alanda", "أبو علندا", "Abu Alanda"),
      area("amman-jweideh", "الجويدة", "Al-Jweideh"),
      area("amman-khreibet-souq", "خريبة السوق", "Khreibet Al-Souq"),
      area("amman-muqabalein", "المقابلين", "Al-Muqabalein"),
      area("amman-raqim", "الرقيم", "Al-Raqim"),
      area("amman-yadudeh", "اليادودة", "Al-Yadudeh"),
      area("amman-tal-jawa", "تل جاوة", "Tal Jawa"),
      // West / south-west (وادي السير، ناعور)
      area("amman-wadi-seer", "وادي السير", "Wadi Al-Seer"),
      area("amman-marj-hamam", "مرج الحمام", "Marj Al-Hamam"),
      area("amman-badr-jadideh", "بدر الجديدة", "Badr Al-Jadideh"),
      area("amman-iraq-amir", "عراق الأمير", "Iraq Al-Amir"),
      area("amman-bassa", "البصة", "Al-Bassa"),
      area("amman-fheis-road", "الفحص", "Al-Fahs"),
      area("amman-naour", "ناعور", "Na'our"),
      area("amman-hisban", "حسبان", "Hisban"),
      area("amman-um-basatin", "أم البساتين", "Umm Al-Basatin"),
      // Outer districts
      area("amman-sahab", "سحاب", "Sahab"),
      area("amman-muwaqqar", "الموقر", "Al-Muwaqqar"),
      area("amman-jiza", "الجيزة", "Al-Jiza"),
      area("amman-um-rasas", "أم الرصاص", "Umm Ar-Rasas"),
      area("amman-dhabaa", "ضبعة", "Dhab'a"),
      area("amman-khalidiyeh", "الخالدية", "Al-Khalidiyeh"),
      area("amman-other", "منطقة ثانية بعمّان", "Another area in Amman"),
    ],
  },
  {
    value: "irbid",
    ar: "إربد",
    en: "Irbid",
    areas: [
      area("irbid-city", "إربد (المدينة)", "Irbid city"),
      area("irbid-idoun", "إيدون", "Idoun"),
      area("irbid-sareeh", "الصريح", "Al-Sareeh"),
      area("irbid-husn", "الحصن", "Al-Husn"),
      area("irbid-naimeh", "النعيمة", "Al-Naimeh"),
      area("irbid-bushra", "بشرى", "Bushra"),
      area("irbid-huwwara", "حوارة", "Huwwara"),
      area("irbid-beit-ras", "بيت راس", "Beit Ras"),
      area("irbid-kufr-jayez", "كفر جايز", "Kufr Jayez"),
      area("irbid-hakama", "حكما", "Hakama"),
      area("irbid-sal", "سال", "Sal"),
      area("irbid-alaal", "علعال", "Al'al"),
      area("irbid-mughayyer", "المغير", "Al-Mughayyer"),
      area("irbid-fooara", "فوعرا", "Foo'ara"),
      area("irbid-marw", "مرو", "Marw"),
      area("irbid-kitim", "كتم", "Kitim"),
      area("irbid-bani-obeid", "بني عبيد", "Bani Obeid"),
      area("irbid-ramtha", "الرمثا", "Ar-Ramtha"),
      area("irbid-mazar-shamali", "المزار الشمالي", "Al-Mazar Al-Shamali"),
      area("irbid-bani-kinanah", "بني كنانة (سما الروسان)", "Bani Kinanah (Sama Al-Rousan)"),
      area("irbid-kourah", "الكورة (دير أبي سعيد)", "Al-Kourah (Deir Abi Said)"),
      area("irbid-taybeh", "الطيبة", "At-Taybeh"),
      area("irbid-wastiyyeh", "الوسطية (كفر أسد)", "Al-Wastiyyah (Kufr Asad)"),
      area("irbid-shuna-shamaliyyeh", "الشونة الشمالية", "North Shuna"),
      area("irbid-aghwar-shamaliyyeh", "الأغوار الشمالية", "Northern Jordan Valley"),
      area("irbid-other", "منطقة ثانية بإربد", "Another area in Irbid"),
    ],
  },
  {
    value: "zarqa",
    ar: "الزرقاء",
    en: "Zarqa",
    areas: [
      area("zarqa-city", "الزرقاء (المدينة)", "Zarqa city"),
      area("zarqa-jadideh", "الزرقاء الجديدة", "New Zarqa"),
      area("zarqa-russeifa", "الرصيفة", "Russeifa"),
      area("zarqa-hashemiyah", "الهاشمية", "Al-Hashemiyah"),
      area("zarqa-sukhneh", "السخنة", "As-Sukhneh"),
      area("zarqa-dhuleil", "الضليل", "Adh-Dhulayl"),
      area("zarqa-qasr-hallabat", "قصر الحلابات", "Qasr Al-Hallabat"),
      area("zarqa-bireen", "بيرين", "Bireen"),
      area("zarqa-azraq-shamali", "الأزرق الشمالي", "North Azraq"),
      area("zarqa-azraq-janubi", "الأزرق الجنوبي", "South Azraq"),
      area("zarqa-abu-zighan", "أبو الزيغان", "Abu Az-Zighan"),
      area("zarqa-dawqara", "دوقرة", "Dawqara"),
      area("zarqa-jareeba", "الجريبة", "Al-Jareeba"),
      area("zarqa-other", "منطقة ثانية بالزرقاء", "Another area in Zarqa"),
    ],
  },
  {
    value: "balqa",
    ar: "البلقاء",
    en: "Balqa",
    areas: [
      area("balqa-salt", "السلط", "As-Salt"),
      area("balqa-ain-basha", "عين الباشا", "Ain Al-Basha"),
      area("balqa-baqaa", "البقعة", "Al-Baqaa"),
      area("balqa-safout", "صافوط", "Safout"),
      area("balqa-um-danabir", "أم الدنانير", "Umm Ad-Dananir"),
      area("balqa-rumman", "الرمان", "Ar-Rumman"),
      area("balqa-fuhais", "الفحيص", "Fuhais"),
      area("balqa-mahes", "ماحص", "Mahes"),
      area("balqa-zay", "زي", "Zay"),
      area("balqa-eira-yarqa", "عيرا ويرقا", "Eira & Yarqa"),
      area("balqa-aridah", "العارضة", "Al-Aridah"),
      area("balqa-deir-alla", "دير علا", "Deir Alla"),
      area("balqa-shuna-janubiyyeh", "الشونة الجنوبية", "South Shuna"),
      area("balqa-karameh", "الكرامة", "Al-Karameh"),
      area("balqa-rameh", "الرامة", "Ar-Rameh"),
      area("balqa-kafrein", "الكفرين", "Al-Kafrein"),
      area("balqa-suwaimeh", "سويمة", "Suwaimeh"),
      area("balqa-other", "منطقة ثانية بالبلقاء", "Another area in Balqa"),
    ],
  },
  {
    value: "mafraq",
    ar: "المفرق",
    en: "Mafraq",
    areas: [
      area("mafraq-city", "المفرق (المدينة)", "Mafraq city"),
      area("mafraq-balama", "بلعما", "Bal'ama"),
      area("mafraq-rhab", "إرحاب", "Rhab"),
      area("mafraq-manshiyat-bani-hasan", "منشية بني حسن", "Manshiyat Bani Hasan"),
      area("mafraq-safawi", "الصفاوي", "As-Safawi"),
      area("mafraq-sabha", "صبحا", "Sabha"),
      area("mafraq-um-jimal", "أم الجمال", "Umm Al-Jimal"),
      area("mafraq-deir-kahf", "دير الكهف", "Deir Al-Kahf"),
      area("mafraq-um-qutain", "أم القطين", "Umm Al-Qutain"),
      area("mafraq-salhiyeh", "الصالحية", "As-Salhiyeh"),
      area("mafraq-zaatari", "الزعتري", "Az-Zaatari"),
      area("mafraq-sama-sarhan", "سما السرحان", "Sama As-Sarhan"),
      area("mafraq-hosha", "حوشا", "Hosha"),
      area("mafraq-khalidiyeh", "الخالدية", "Al-Khalidiyeh"),
      area("mafraq-ruwayshid", "الرويشد", "Ar-Ruwayshid"),
      area("mafraq-other", "منطقة ثانية بالمفرق", "Another area in Mafraq"),
    ],
  },
  {
    value: "madaba",
    ar: "مأدبا",
    en: "Madaba",
    areas: [
      area("madaba-city", "مأدبا (المدينة)", "Madaba city"),
      area("madaba-maeen", "ماعين", "Ma'in"),
      area("madaba-jreineh", "جرينة", "Jreineh"),
      area("madaba-faisaliyeh", "الفيصلية", "Al-Faisaliyeh"),
      area("madaba-mamouniyeh", "المأمونية", "Al-Ma'muniyeh"),
      area("madaba-dhiban", "ذيبان", "Dhiban"),
      area("madaba-mulaih", "مليح", "Mulaih"),
      area("madaba-areedh", "العريض", "Al-Areedh"),
      area("madaba-other", "منطقة ثانية بمأدبا", "Another area in Madaba"),
    ],
  },
  {
    value: "jerash",
    ar: "جرش",
    en: "Jerash",
    areas: [
      area("jerash-city", "جرش (المدينة)", "Jerash city"),
      area("jerash-souf", "سوف", "Souf"),
      area("jerash-sakib", "ساكب", "Sakib"),
      area("jerash-eisra", "عيصرة", "Eisra"),
      area("jerash-kufr-khal", "كفرخل", "Kufr Khal"),
      area("jerash-kitteh", "الكتة", "Al-Kitteh"),
      area("jerash-raymun", "ريمون", "Raymun"),
      area("jerash-balila", "بليلا", "Balila"),
      area("jerash-qafqafa", "قفقفا", "Qafqafa"),
      area("jerash-nahleh", "نحلة", "Nahleh"),
      area("jerash-deir-liyat", "دير الليات", "Deir Al-Liyat"),
      area("jerash-nabi-hud", "النبي هود", "An-Nabi Hud"),
      area("jerash-mastabah", "المصطبة", "Al-Mastabah"),
      area("jerash-marsaa", "مرصع", "Marsa'"),
      area("jerash-jabbah", "جبة", "Jabbah"),
      area("jerash-burma", "برما", "Burma"),
      area("jerash-mansoura", "المنصورة", "Al-Mansoura"),
      area("jerash-majdal", "المجدل", "Al-Majdal"),
      area("jerash-alimoun", "عليمون", "Alimoun"),
      area("jerash-dibbeen", "دبين", "Dibbeen"),
      area("jerash-souf-camp", "مخيم سوف", "Souf Camp"),
      area("jerash-gaza-camp", "مخيم غزة", "Gaza Camp"),
      area("jerash-other", "منطقة ثانية بجرش", "Another area in Jerash"),
    ],
  },
  {
    value: "ajloun",
    ar: "عجلون",
    en: "Ajloun",
    areas: [
      area("ajloun-city", "عجلون (المدينة)", "Ajloun city"),
      area("ajloun-anjara", "عنجرة", "Anjara"),
      area("ajloun-kufranjah", "كفرنجة", "Kufranjah"),
      area("ajloun-sakhra", "صخرة", "Sakhra"),
      area("ajloun-ain-jana", "عين جنا", "Ain Jana"),
      area("ajloun-wahadneh", "الوهادنة", "Al-Wahadneh"),
      area("ajloun-halawa", "حلاوة", "Halawa"),
      area("ajloun-rasoun", "راسون", "Rasoun"),
      area("ajloun-orjan", "عرجان", "Orjan"),
      area("ajloun-baoun", "باعون", "Baoun"),
      area("ajloun-ebbin-ebillin", "عبين وعبلين", "Ebbin & Ebillin"),
      area("ajloun-hashimiyyeh", "الهاشمية", "Al-Hashimiyyeh"),
      area("ajloun-ras-munif", "رأس منيف", "Ras Munif"),
      area("ajloun-jabal-akhdar", "الجبل الأخضر", "Al-Jabal Al-Akhdar"),
      area("ajloun-deir-samadiyyeh", "دير السمادية", "Deir As-Samadiyyeh"),
      area("ajloun-other", "منطقة ثانية بعجلون", "Another area in Ajloun"),
    ],
  },
  {
    value: "karak",
    ar: "الكرك",
    en: "Karak",
    areas: [
      area("karak-city", "الكرك (المدينة)", "Karak city"),
      area("karak-adar", "أدر", "Adar"),
      area("karak-shihabiyyeh", "الشهابية", "Ash-Shihabiyyeh"),
      area("karak-jadideh", "الجديدة", "Al-Jadideh"),
      area("karak-rakeen", "راكين", "Rakeen"),
      area("karak-adnaniyyeh", "العدنانية", "Al-Adnaniyyeh"),
      area("karak-rashadiyyeh", "الراشدية", "Ar-Rashadiyyeh"),
      area("karak-lajjoun", "اللجون", "Al-Lajjoun"),
      area("karak-mutah", "مؤتة", "Mutah"),
      area("karak-mazar-janubi", "المزار الجنوبي", "Al-Mazar Al-Janubi"),
      area("karak-taybeh", "الطيبة", "At-Taybeh"),
      area("karak-dhat-ras", "ذات راس", "Dhat Ras"),
      area("karak-mihna", "محي", "Mihna"),
      area("karak-soul", "سول", "Soul"),
      area("karak-qasr", "القصر", "Al-Qasr"),
      area("karak-rabbah", "الربة", "Ar-Rabbah"),
      area("karak-samakiyyeh", "السماكية", "As-Samakiyyeh"),
      area("karak-shihan", "شيحان", "Shihan"),
      area("karak-husayniyyeh-moab", "الحسينية (مؤاب)", "Al-Husayniyyeh (Moab)"),
      area("karak-faisaliyyeh", "الفيصلية", "Al-Faisaliyyeh"),
      area("karak-qatraneh", "القطرانة", "Al-Qatraneh"),
      area("karak-ayy", "عي", "Ayy"),
      area("karak-faqqu", "فقوع", "Faqqu'"),
      area("karak-ghor-safi", "غور الصافي", "Ghor As-Safi"),
      area("karak-ghor-mazraa", "غور المزرعة", "Ghor Al-Mazra'a"),
      area("karak-ghor-fifa", "غور فيفا", "Ghor Fifa"),
      area("karak-ghor-haditha", "غور الحديثة", "Ghor Al-Haditha"),
      area("karak-other", "منطقة ثانية بالكرك", "Another area in Karak"),
    ],
  },
  {
    value: "maan",
    ar: "معان",
    en: "Ma'an",
    areas: [
      area("maan-city", "معان (المدينة)", "Ma'an city"),
      area("maan-petra", "وادي موسى (البتراء)", "Wadi Musa (Petra)"),
      area("maan-taybeh", "الطيبة", "At-Taybeh"),
      area("maan-rajef", "الراجف", "Ar-Rajef"),
      area("maan-dalagha", "دلاغة", "Dalagha"),
      area("maan-baida", "البيضا", "Al-Baida"),
      area("maan-shawbak", "الشوبك", "Ash-Shawbak"),
      area("maan-jafr", "الجفر", "Al-Jafr"),
      area("maan-husayniyyah", "الحسينية", "Al-Husayniyyah"),
      area("maan-ail", "أيل", "Ail"),
      area("maan-udhruh", "أذرح", "Udhruh"),
      area("maan-mreigha", "المريغة", "Al-Mreigha"),
      area("maan-fujeij", "الفجيج", "Al-Fujeij"),
      area("maan-other", "منطقة ثانية بمعان", "Another area in Ma'an"),
    ],
  },
  {
    value: "aqaba",
    ar: "العقبة",
    en: "Aqaba",
    areas: [
      area("aqaba-city", "العقبة (المدينة)", "Aqaba city"),
      area("aqaba-shallaleh", "الشلالة", "Ash-Shallaleh"),
      area("aqaba-quwayra", "القويرة", "Al-Quwayra"),
      area("aqaba-disah", "الديسة", "Ad-Disah"),
      area("aqaba-wadi-rum", "وادي رم", "Wadi Rum"),
      area("aqaba-wadi-araba", "وادي عربة", "Wadi Araba"),
      area("aqaba-rahmeh", "رحمة", "Rahmeh"),
      area("aqaba-other", "منطقة ثانية بالعقبة", "Another area in Aqaba"),
    ],
  },
  {
    value: "tafilah",
    ar: "الطفيلة",
    en: "Tafilah",
    areas: [
      area("tafilah-city", "الطفيلة (المدينة)", "Tafilah city"),
      area("tafilah-aima", "أيمة", "Aima"),
      area("tafilah-abour", "العابور", "Al-Abour"),
      area("tafilah-rashadiyyeh", "الرشادية", "Ar-Rashadiyyeh"),
      area("tafilah-afra", "عفرا", "Afra"),
      area("tafilah-busayra", "بصيرا", "Busayra"),
      area("tafilah-dana", "ضانا", "Dana"),
      area("tafilah-gharandal", "غرندل", "Gharandal"),
      area("tafilah-sanfaha", "صنفحة", "Sanfaha"),
      area("tafilah-qadisiyyeh", "القادسية", "Al-Qadisiyyeh"),
      area("tafilah-eis", "العيص", "Al-Eis"),
      area("tafilah-hasa", "الحسا", "Al-Hasa"),
      area("tafilah-other", "منطقة ثانية بالطفيلة", "Another area in Tafilah"),
    ],
  },
];

/** `lang`-appropriate name for a governorate; falls back to the stored value. */
export function cityLabel(value, lang = "ar") {
  if (!value) return "";
  const city = JORDAN_CITIES.find((c) => c.value === value);
  // Orders placed before this was a dropdown hold free-typed text — showing it
  // back verbatim beats showing nothing.
  return city ? city[lang === "en" ? "en" : "ar"] : value;
}

/**
 * `lang`-appropriate name for an area, looked up across every governorate.
 *
 * Flat by design: the slugs are globally unique precisely so callers that have
 * no city in scope (`briefText`) can resolve one.
 */
export function areaLabel(value, lang = "ar") {
  if (!value) return "";
  for (const city of JORDAN_CITIES) {
    const found = city.areas.find((a) => a.value === value);
    if (found) return found[lang === "en" ? "en" : "ar"];
  }
  return value;
}

/** Options for the city select, in this locale. */
export function cityOptions(lang = "ar") {
  return JORDAN_CITIES.map((c) => ({
    value: c.value,
    label: c[lang === "en" ? "en" : "ar"],
  }));
}

/** Options for the area select, for whichever city is currently chosen. */
export function areaOptions(cityValue, lang = "ar") {
  const city = JORDAN_CITIES.find((c) => c.value === cityValue);
  if (!city) return [];
  return city.areas.map((a) => ({
    value: a.value,
    label: a[lang === "en" ? "en" : "ar"],
  }));
}
