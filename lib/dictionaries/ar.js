// Arabic copy — the source language. The register is deliberately colloquial
// Jordanian in the body copy and simple MSA in the headings, matching how the
// brand talks to parents on Instagram.
//
// TODO markers below mirror the ones in en.js: prices, turnaround, age range
// and the refund policy are placeholders in BOTH languages and
// must not be "translated" into invented values.

export const ar = {
  lang: "ar",
  meta: {
    title: "قصص أطفال مخصصة ومصورة في الأردن | قصتي",
    description:
      "قصص أطفال مصورة ومخصصة بالكامل في الأردن، تُكتب من الصفر حول اسم طفلك وشخصيته ومغامراته. اطلبوها PDF أو كتاباً مطبوعاً.",
    ogTitle: "قصتي | طفلك بطل حكايته الخاصة",
    ogDescription: "قصص مصورة مخصصة بالكامل لطفلك، باسمه وشخصيته ومغامراته.",
    ogLocale: "ar_JO",
    socialImageAlt: "شعار قصتي: طفل يمد يده نحو نجمة من كتاب مفتوح",
  },

  brand: {
    // The wordmark beside the logo mark.
    wordmark: "قصتي",
  },

  nav: {
    how: "كيف تعمل",
    tiers: "أنواع القصص",
    sample: "نموذج قصة",
    pricing: "الأسعار",
    faq: "أسئلة شائعة",
    order: "اطلب قصة",
  },

  header: {
    homeLabel: "قصتي — الصفحة الرئيسية",
    navLabel: "التنقل الرئيسي",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    order: "اطلب الآن",
    // Language toggle. `switchTo` is the accessible label, `short` the chip.
    langLabel: "اللغة",
    langSwitchTo: "Switch to English",
    langShortCurrent: "ع",
    langShortOther: "EN",
  },

  hero: {
    badge: "قصص مصنوعة يدوياً في الأردن",
    // Three parts so the middle word can carry the gold highlight.
    titleA: "طفلك",
    titleB: "بطل",
    titleC: "حكايته الخاصة",
    lead: "قصص مصورة مخصصة بالكامل لطفلك، باسمه وشخصيته ومغامراته — تُكتب من الصفر حوله، مش قصة جاهزة منبدّل فيها الاسم.",
    rolesPrefix: "هالمرة، طفلك هو",
    // Straight from the brief's own story-type list.
    roles: ["شرطي", "طبيبة", "رائد فضاء", "مستكشفة", "طيار", "عالمة"],
    ctaOrder: "اطلب قصة طفلك الآن",
    ctaSample: "شوف نموذج قصة",
    reassure: "بترد عليكم رسالة على إنستغرام خلال ساعات — بدون أي التزام.",
  },

  trust: {
    label: "لماذا قصتي",
    items: [
      {
        title: "قصة مكتوبة خصيصاً له",
        body: "مش قالب جاهز منغيّر فيه الاسم — القصة تُبنى حول شخصية طفلك.",
      },
      {
        title: "PDF أو نسخة مطبوعة",
        body: "استلمها على جوالك، أو نسخة مطبوعة توصلكم لباب البيت.",
      },
      {
        title: "جاهزة خلال أيام قليلة",
        body: "من لحظة ما تبعتولنا تفاصيل طفلك، بتكون القصة بين إيديكم بسرعة.",
      },
    ],
  },

  how: {
    eyebrow: "ثلاث خطوات بس",
    title: "كيف بتصير القصة؟",
    lead: "من أول رسالة لحد ما تكون القصة بين إيدين طفلك.",
    note: "استمارة قصيرة بتاخد دقائق، وباقي الحكي بصير بالرسالة.",
    steps: [
      {
        title: "أخبرنا عن طفلك",
        body: "تعبّئون استمارة بسيطة عن اسمه، شخصيته، واهتماماته.",
      },
      {
        title: "اختاروا نوع القصة",
        body: "قصة بطل (شرطي، طبيبة، رائدة فضاء…) أو قصة بهدف (الشجاعة، الصدق، تقبّل الأخ الجديد…).",
      },
      {
        title: "استلموا القصة",
        body: "عبر واتساب أو البريد الإلكتروني، أو نسخة مطبوعة توصلكم لباب البيت.",
      },
    ],
  },

  tiers: {
    eyebrow: "خياران",
    title: "اختاروا مستوى التخصيص",
    lead: "الاثنين بيوصلوا لنفس النتيجة: طفلك بطل القصة. الفرق بس بمقدار ما تُكتب القصة حوله.",
    mostPopular: "الأكثر طلباً",
    comingSoon: "قريباً",
    cta: "اسألوا عن هذا الخيار",
    items: {
      avatar: {
        name: "أفاتار فقط",
        sub: "السعر الأقل",
        body: "نفس القصص المجرّبة والمحبوبة، مع شخصية مرسومة تشبه طفلك. تجهيز أسرع.",
        points: [
          "شخصية مرسومة تشبه ملامح طفلك",
          "قصص جاهزة مجرّبة ومحبوبة من الأطفال",
          "اسم طفلك داخل القصة",
          "أسرع تجهيز",
        ],
      },
      custom: {
        name: "قصة مخصصة بالكامل",
        sub: "الخيار المميز",
        body: "قصة تُكتب من الصفر حول شخصية طفلك الحقيقية وتفاصيله الخاصة، مع رسومات تحمل ملامحه.",
        points: [
          "قصة تُكتب من الصفر خصيصاً لطفلك",
          "مبنية على شخصيته الحقيقية وتفاصيله",
          "رسومات تحمل ملامحه في كل صفحة",
          "موقف أو ذكرى حقيقية داخل القصة",
        ],
      },
    },
  },

  sample: {
    eyebrow: "نموذج توضيحي",
    title: "شوفوا كيف صارت تفاصيل ليان قصة",
    lead: "لَيَان، طِفْلَةٌ عُمْرُهَا أَرْبَعُ سَنَوَاتٍ، بْتِحْلَم تْصِير طَبِيبَة حَيَوَانَات. فِي حَدِيقَةِ بَيْتِهَا بِعَمَّان، بْتِكْتِشِف قِطَّة صْغِيرَة خَايْفَة، وَبْتِسْتَخْدِم فُضُولْهَا وَحَنَانْهَا وَجَرَابِينْهَا الْمُلَوَّنَة عَشَان تْطَمِّنْهَا.",
    bookTitleTop: "طَبِيبَةُ الْحَيَوَانَاتِ لَيَان",
    bookTitleBottom: "وَجَرَابِينُهَا الْمُلَوَّنَةُ",
    bookFullTitle: "طَبِيبَةُ الْحَيَوَانَاتِ لَيَان وَجَرَابِينُهَا الْمُلَوَّنَةُ",
    bookNote: "قصة مخصصة بالكامل مبنية على الطلب التسويقي التجريبي Q-000002: شخصية ليان، حبها للقطط والألوان، وجرابان مختلفان صاروا جزءاً من الحل.",
    galleryHint: "اضغطوا على أي صفحة تحت لتشوفوها كاملة",
    quote: "«إِلَى لَيَان الْحِلْوَة.. خَلِّيكِي دَايْماً فُضُولِيَّة وَحَنُونَة، وَخَلِّي جَرَابِينِك الْمُلَوَّنَة دَايْماً تِنْشُرِ الْفَرَح فِي قُلُوبِ الْقِطَطِ الَّلِي بْتِحِبِّيهَا.»",
    quoteAttribution: "",
  },

  pricing: {
    eyebrow: "الأسعار",
    title: "بسيطة وواضحة",
    note: "السعر النهائي بيعتمد على نوع القصة (أفاتار أو مخصصة بالكامل) وعدد الصفحات.",
    startsFrom: "يبدأ من",
    currency: "دينار",
    cta: "اطلبوا هذه النسخة",
    footnote: "حابين تسألوا عن سعر حالة معينة؟ راسلونا وبنرد عليكم بسرعة.",
    plans: {
      // TODO: replace [X] with the real prices before launch.
      pdf: {
        name: "نسخة PDF",
        price: "[X]",
        note: "يوصلكم على واتساب أو الإيميل",
        points: [
          "ملف جاهز للطباعة أو القراءة على الجوال",
          "تجهيز أسرع",
          "بتقدروا تطبعوها وقت ما بدكم",
        ],
      },
      print: {
        name: "نسخة مطبوعة",
        price: "[X]",
        note: "توصيل داخل الأردن",
        points: ["كتاب مطبوع بجودة عالية", "هدية جاهزة للتغليف", "بيضل ذكرى تنحفظ"],
      },
    },
  },

  faq: {
    eyebrow: "أسئلة شائعة",
    title: "في شي بخاطركم؟",
    lead: "وإذا سؤالكم مش موجود هون، راسلونا على إنستغرام وبنجاوبكم.",
    // TODO: fill in the bracketed values ([X] days, age range) before launch.
    items: [
      {
        q: "كم يوم تحتاج القصة لتجهز؟",
        // [X] = النسخة الرقمية، [Y] = المطبوعة. الوحدة بتيجي من daysLabel،
        // فما بنكرر كلمة "أيام" بعد القوس.
        a: "النسخة الرقمية عادة خلال [X]، والمطبوعة خلال [Y]، من وقت ما نستلم معلومات طفلكم. إذا كنتم مستعجلين لمناسبة معينة، خبرونا وبنشوف شو بنقدر نعمل.",
      },
      {
        q: "شو المعلومات يلي لازم أرسلها عن طفلي؟",
        a: "الاسم، العمر، صفتين من شخصيته، شي بيحبه، ونوع القصة المناسبة له. وإذا في صورة واضحة لطفلك، بتساعدنا نرسم شخصية تشبهه.",
      },
      {
        q: "هل القصة تناسب كل الأعمار؟",
        a: "القصص مصممة للأطفال من [X-Y] سنوات تقريباً. بنقدر نعدّل طول القصة ومستوى اللغة حسب عمر طفلك.",
      },
      {
        q: "بأي لغة أو لهجة تُكتب القصة؟",
        a: "بتقدروا تختاروا عربية فصحى بسيطة، أو لهجة أردنية، أو إنجليزية. وكمان بنعدّل المفردات وطول الجمل حسب عمر طفلكم.",
      },
      {
        q: "شو بيميز قصتي عن قصة جاهزة منبدّل فيها الاسم؟",
        a: "كل قصة مخصصة بالكامل من قصتي بتنكتب من الصفر حول شخصية الطفل واهتماماته وتفاصيله الخاصة والمغامرة اللي اختارها. الاسم جزء من القصة، مش التغيير الوحيد فيها.",
      },
      {
        q: "لوين بتوصل قصتي؟",
        a: "قصتي مشروع أردني. قصص PDF بتوصلكم إلكترونياً، والكتب المطبوعة بنوصلها داخل الأردن.",
      },
      {
        // TODO: the return / revision policy is not finalized yet.
        q: "شو إذا ما عجبتني القصة؟",
        a: "سياسة التعديل والاسترجاع لسا عم نجهزها. حالياً، إذا في شي مش عاجبكم بالقصة، راسلونا وبنشتغل معكم عليه لحد ما تطلع متل ما تتمنوا.",
      },
    ],
  },

  finalCta: {
    title: "جاهزين تصيروا طفلكم بطل قصته؟",
    lead: "راسلونا على إنستغرام وخبرونا عن طفلك — وبنرجعلكم بفكرة قصة مفصّلة إله.",
    cta: "تواصلوا معنا الآن",
  },

  footer: {
    tagline: "طفلك بطل حكايته الخاصة",
    contactNote: "للطلبات والاستفسارات، راسلونا على إنستغرام.",
    // {year} is substituted at render time.
    copyright: "© {year} قصتي — صُنعت بحب في الأردن.",
  },

  book: {
    coverAlt:
      "غلاف قصة طبيبة الحيوانات ليان: طفلة بفستان أصفر وجراب أصفر وآخر أخضر، جالسة في حديقة البيت قرب قطتها البيضاء",
    chipTitle: "قصة ليان",
    chipSub: "نموذج تسويقي توضيحي",
    chipBadge: "مخصصة بالكامل",
    spreads: {
      page1: {
        category: "البداية",
        title: "شَمْس ونَعْنَع",
        body: "فِي حَدِيقَةِ الْبَيْتِ بِعَمَّان، لَيَان قَاعْدَة بْتِلْعَب مَع قِطَّتْهَا الْبَيْضَا لَوْز. لَيَان دَايْماً بْتِلْبَس جَرَابِين بِلُونِين مُخْتَلِفِين، الْيُوم لَابْسَة جِرْبَان أَصْفَر اسْمُه «شَمْس»، وَجِرْبَان أَخْضَر اسْمُه «نَعْنَع». هِيَّ نِفْسْهَا تْصِير طَبِيبَة حَيَوَانَات.",
        alt: "ليان جالسة على سور حجري في حديقة بيت بعمان وتلعب مع قطتها البيضاء لوز، وجراباها الأصفر والأخضر واضحان",
      },
      page2: {
        category: "الاكتشاف",
        title: "صوت من ورا الزيتونة",
        body: "فَجْأَة، سِمْعَت صُوت «نْيَاو» صْغِير طَالِع مِنْ وَرَا شَجَرَةِ الزَّيْتُون. بِفُضُولِهَا، رَكَضَت لَيَان تْشُوف شُو فِيه، وَلَقَت قِطَّة صْغِيرَة كْتِير مْخَبَّيَة بَيْنِ الْوَرَق، خَايْفَة وَمِش عَارْفَة تِطْلَع.",
        alt: "ليان تطل من خلف جذع زيتونة عريض وترى هريرة برتقالية صغيرة مختبئة بين الأغصان المنخفضة",
      },
      page3: {
        category: "المحاولة الأولى",
        title: "لَيَان تبدأ مهمتها",
        body: "لَيَان قَرَّرَت تْبَلِّش شُغْلْهَا كَطَبِيبَة. قَرَّبَت شْوَي شْوَي وَقَالَت بِحَنِيَّة: «تَعَالِي يَا حِلْوَة، أَنَا هُون عَشَان أَسَاعْدِك». بَسِّ الْقِطَّة كَشَّت وَرِجْعَت لَوَرَا، وَلَوْز قَعَد يِتْفَرَّج بِهُدُوء.",
        alt: "ليان تنحني وتمد يدها بهدوء نحو هريرة برتقالية مترددة بين الشجيرات، ولوز جالسة خلفها",
      },
      page4: {
        category: "الخطة",
        title: "الأمان أول إشي",
        body: "فَكَّرَت لَيَان كِيف مُمْكِن تْطَمِّنِ الْقِطَّة. عِرْفَت إِنُّو الطَّبِيبِ الشَّاطِر لَازِم يْخَلِّي الْحَيَوَانَات تْحِس بِالْأَمَان أَوَّل إِشِي. جَابَت سَلَّة صْغِيرَة فِيهَا حْرَام، وَحَطَّتْهَا قَرِيب مِنْهَا.",
        alt: "يدا ليان تضعان سلة قش صغيرة مبطنة ببطانية زرقاء على عشب الحديقة قرب الشجيرات",
      },
      page5: {
        category: "الفكرة",
        title: "الألوان تصير الحل",
        body: "لَاحَظَت لَيَان إِنُّو عُيُونِ الْقِطَّة عَم تِتْطَلَّع عَلَى أَلْوَان جَرَابِينْهَا الْحِلْوَة. لَيَان بْتِحِبِّ الْأَلْوَان وِالْقِطَط، وَفَكَّرَت إِنُّو أَصْحَابْهَا «شَمْس» وَ«نَعْنَع» مُمْكِن يْكُونُوا هُمَّ الْحَل.",
        alt: "ليان تنظر بابتسامة ذكية إلى جرابيها المختلفين، واحد أصفر وواحد أخضر، بينما قطتها البيضاء بجانبها",
      },
      page6: {
        category: "التجربة",
        title: "شَمْس ونَعْنَع يتحركوا",
        body: "شَلْحَت لَيَان كُنْدَرِتْهَا، وَصَارَت تْحَرِّك رِجْلِيهَا شْوَي شْوَي عَشَان تِجْذِب انْتِبَاهِ الْقِطَّة. قَالَتْلْهَا: «شُوفِي، هَاد شَمْس بِيْحِب يِلْعَب مَعِك، وَنَعْنَع رَح يِدَفِّيكِي».",
        alt: "ليان جالسة على العشب تحرك جرابيها الأصفر والأخضر بعد خلع حذائها، والهريرة تطل من الشجيرات",
      },
      page7: {
        category: "أول ثقة",
        title: "كف صغيرة تلمس شَمْس",
        body: "الْقِطَّةِ الصَّغِيرَة نِسْيَت خُوفْهَا لَمَّا شَافَتِ الْأَلْوَان عَم تِتْحَرَّك بِلُطْف. مَدَّت إِيدْهَا الصَّغِيرَة وَصَارَت تِحَاوِل تِمْسِكِ الْجِرْبَانِ الْأَصْفَر «شَمْس»، وَلَوْز مَاوَى «مَاو» صْغِيرَة لَيِشَجِّعْهَا.",
        alt: "هريرة برتقالية ترفع كفها لتلعب بجراب ليان الأصفر، ولوز البيضاء تراقب من الخلف",
      },
      page8: {
        category: "الحل",
        title: "خطوة خطوة نحو السلة",
        body: "بِحَرَكَة ذَكِيَّة، اسْتَخْدَمَت لَيَان جَرَابِينْهَا عَشَان تْدِلِّ الْقِطَّة خُطْوَة خُطْوَة لَعِنْدِ السَّلَّة الْمُرِيحَة. الْقِطَّة مِشْيَت وَرَا «نَعْنَع» لَحَد مَا نَطَّت جُوَّا السَّلَّة وَقَعْدَت بِأَمَان.",
        alt: "ليان تجلس قرب جرابيها الملونين والهريرة البرتقالية وصلت إلى السلة المبطنة، ولوز بجانبها",
      },
      page9: {
        category: "النتيجة",
        title: "المهمة نجحت",
        body: "ابْتَسْمَت لَيَان وَهِيَّ عَم تِتْفَرَّج عَلَى الْقِطَّةِ الصَّغِيرَة عَم تِتْدَفَّى وَتْخَرْخِر جُوَّا السَّلَّة جَنْب حُوضِ النَّعْنَع. الْمُهِمَّة نِجْحَت، وَالْقِطَّة رِجْعَت مَبْسُوطَة لَمَكَان دَافِي فِي الْحَدِيقَة.",
        alt: "ليان تبتسم قرب سلة فيها هريرة برتقالية نائمة على بطانية زرقاء، ولوز البيضاء تشم السلة",
      },
      page10: {
        category: "النهاية",
        title: "راحة طبيبة الحيوانات",
        body: "قَعْدَت لَيَان عَلَى الْعُشُبِ الْأَخْضَر، وَلَوْز نَام دَافِي بِحُضْنْهَا. هِزَّت رِجْلِيهَا بِالْهَوَا، وَخَلَّت «شَمْس» وَ«نَعْنَع» يِسَلِّمُوا عَلَى بَعْض بِفَرَح. حَتَّى طَبِيبَةُ الْحَيَوَانَات بْتِحْتَاج لَحَظَات رَاحَة بَعْد عَمَل نَاجِح.",
        alt: "ليان مستلقية على عشب الحديقة وقت الغروب وترفع جرابيها الأصفر والأخضر، ولوز نائمة على بطنها",
      },
    },
  },

  // ── Order page ────────────────────────────────────────────────────────
  // The fields here exist to fill the variables in the AI prompt templates
  // (see CLAUDE.md, "The order page"). Renaming a key without updating the
  // prompt that consumes it is how this silently breaks.
  order: {
    metaTitle: "اطلبوا قصة طفلكم | قصتي",
    metaDescription:
      "عبّوا تفاصيل طفلكم وشو بتحبوا تكون القصة، وبنرجعلكم بفكرة قصة مفصّلة إله.",
    kicker: "طلب قصة",
    title: "خبرونا عن طفلكم",
    lead: "كل شي هون بنستخدمه لنكتب القصة ونرسم شخصية تشبه طفلكم. خذوا وقتكم — الأسئلة اللي عليها نجمة بس ضرورية.",
    backToHome: "رجوع للصفحة الرئيسية",
    // The page's whole reason for asking this much. It is the same promise the
    // hero and the trust bar make; here it explains why the questions exist.
    promise: {
      title: "مش قالب جاهز",
      body: "كل جواب بتكتبوه بيدخل بالقصة نفسها. ما في قصة جاهزة منبدّل فيها الاسم — القصة تُكتب من الصفر حول طفلكم إنتوا: شخصيته، عاداته، والتفصيلة اللي بتميزه عن غيره.",
    },
    required: "مطلوب",
    // Short on purpose: it lands in a one-line slot that `reserveError` holds
    // open, and a second line would push the field beside it down again.
    invalidPhone: "رقم غير صحيح",
    invalidAge: "عمر غير صحيح",
    invalidChoice: "اختيار غير صحيح",
    tooLong: "الإجابة طويلة جداً",
    optional: "اختياري",

    draft: {
      saved:
        "إجاباتكم بتنحفظ تلقائياً على هالجهاز وبتضل موجودة إذا حدّثتوا الصفحة. الصور بس لازم تختاروها من جديد بعد التحديث.",
      reset: "ابدؤوا من جديد",
      resetConfirm: "متأكدين إنكم بدكم تمسحوا كل الإجابات والصور وتبدؤوا من جديد؟",
    },

    steps: {
      child: { n: "01", title: "عن طفلكم", note: "الأساس اللي بتنبني عليه القصة كلها." },
      story: { n: "02", title: "شكل القصة", note: "نوعها، جوّها، ولغتها." },
      book: { n: "03", title: "الكتاب", note: "مستوى التخصيص وشكل النسخة." },
      contact: { n: "04", title: "نتواصل معكم", note: "آخر خطوة، وبعدها منكمّل بالرسالة." },
    },

    fields: {
      childName: { label: "اسم طفلكم", hint: "متل ما بتنادوه بالبيت — هيك رح ينكتب بالقصة." },
      childAge: { label: "العمر", hint: "بالسنين، من 0 إلى 18." },
      gender: { label: "ولد أو بنت", options: { boy: "ولد", girl: "بنت" } },
      trait1: { label: "صفة أولى من شخصيته", hint: "مثال: فضولي، جريء، حنون." },
      trait2: { label: "صفة تانية", hint: "مثال: عنيد شوي، خجول، كتير بيضحك." },
      favourite: { label: "شي بيحبه كتير", hint: "قطط، سيارات، البحر، الديناصورات…" },
      sidekick: {
        label: "اسم أخ أو صديق أو حيوان أليف",
        hint: "إذا بدكم حدا يطلع معه بالقصة.",
      },
      // The relationship, not decoration: Arabic changes pronoun and adjective
      // endings depending on whether this name is a brother, a sister, a friend
      // or a pet. Without it the story generator has to guess, and guesses
      // wrong half the time. Asked only once a name is actually entered.
      sidekickRelation: {
        label: "شو بيجي لطفلكم؟",
        hint: "منحتاجها عشان نظبط صيغة الكلام بالقصة.",
        placeholder: "اختاروا…",
        options: {
          brother: "أخ",
          sister: "أخت",
          friendBoy: "صديق",
          friendGirl: "صديقة",
          pet: "حيوان أليف",
        },
      },
      sidekickAge: {
        label: "قديش عمره أو عمرها؟",
        hint: "بالسنين (0–120)، عشان نكتب ونرسم رفيق القصة بعمره الصح.",
      },
      petDescription: {
        label: "اوصفولنا الحيوان الأليف",
        hint: "شو نوعه ولونه؟ وإذا بتعرفوا سلالته أو عنده علامة مميزة، احكولنا عنها. مثال: «قطة رمادية صغيرة، صدرها أبيض وعيونها خضر».",
      },
      quirk: {
        label: "عادة أو تفصيلة مميزة عنده",
        hint: "هاي أهم سؤال بالاستمارة. بدنا شي حقيقي بيعملوه — مش صفة عامة. مثال: «بيصرّ يلبس بوطه الأحمر حتى وهو نايم». هاد التفصيل بندخّله بالقصة بأكثر من مكان، وهو اللي بيخلّي القصة قصته هو.",
      },
      storyType: {
        label: "نوع القصة",
        options: {
          goal: "قصة بهدف",
          role: "قصة بطل",
        },
        hints: {
          goal: "بتعالج شي معيّن: الخوف من الظلمة، الشجاعة، تقبّل الأخ الجديد…",
          role: "طفلكم بيصير شي بيحلم فيه: شرطي، طبيبة، رائد فضاء…",
        },
      },
      storyChoice: {
        label: "شو بالتحديد؟",
        hintGoal: "مثال: بيخاف من الظلمة.",
        hintRole: "مثال: بدو يصير شرطي.",
      },
      // Where the story happens. Optional, but it is the difference between a
      // story set in their world and one set nowhere — which is the "قالب
      // جاهز" the whole page promises this is not. The placeholder carries the
      // examples because the answer is short enough to sit in the field.
      setting: {
        label: "وين بتصير القصة؟",
        hint: "مكان حقيقي من حياتهم بيخلّي القصة تحس إنها إلهم.",
        placeholder: "بيتنا بعمّان، بيت ستي بإربد، البحر الميت…",
      },
      // The one field that exists to keep something OUT of the story. A
      // personalised gift that lands on a sore spot is the worst failure this
      // product has, and nothing else on the form asks about it.
      avoid: {
        label: "في شي بتحبوا نتجنبه؟",
        hint: "أي شي حسّاس ما بدنا نذكره — حيوان مات من قريب، حدا مش موجود بحياتهم هلق، أو خوف ما بدكم نحكي عنه.",
      },
      tone: {
        label: "جوّ القصة",
        options: { funny: "مضحكة", sweet: "حنونة وهادية", adventurous: "مغامرة" },
      },
      language: {
        label: "لغة القصة",
        options: {
          msa: "عربية فصحى بسيطة",
          ammiya: "عامية أردنية",
          english: "إنجليزية",
        },
      },
      pages: {
        label: "عدد الصفحات",
        // Arabic number agreement, which "10 صفحة" was getting wrong:
        // 2 takes the dual and absorbs the numeral, 3–10 take the plural,
        // 11 and up take the singular. {n} is the numeral.
        unit: {
          one: "صفحة واحدة",
          two: "صفحتين",
          few: "{n} صفحات",
          many: "{n} صفحة",
        },
      },
      format: { label: "شكل النسخة" },
      // TODO(phase 2): the amounts come from the admin dashboard, not the code.
      addon: {
        included: "شامل",
        extra: "+[X] دينار",
        // The 8-page option is the base story itself, so it adds nothing. A
        // bare price beside "10 صفحات +[X]" read as a separate charge.
        includedInBase: "مشمول ضمن السعر الأساسي",
      },
      // Was one free-text "المدينة أو المنطقة" box, which nobody could
      // dispatch a courier from. Now two dependent selects; the label had to
      // split with them, or "أو المنطقة" would sit on a list of cities only.
      city: {
        label: "المدينة",
        hint: "عشان التوصيل داخل الأردن.",
        placeholder: "اختاروا المدينة…",
      },
      area: {
        label: "المنطقة",
        hint: "بتكفي نعرف المنطقة — العنوان بالتفصيل منتفق عليه بالمحادثة.",
        placeholder: "اختاروا المنطقة…",
      },
      // Not a story input — it fills no placeholder in the AI prompts. It tells
      // us what the book is for, which is what the gift page should sound like,
      // and it is what a future birthday reminder would be keyed on.
      occasion: {
        label: "المناسبة",
        hint: "بتساعدنا نقترح كلام صفحة الهدية.",
        options: {
          birthday: "عيد ميلاد",
          eid: "عيد",
          newSibling: "أخ جديد",
          justBecause: "بس هيك",
        },
      },
      isGift: {
        label: "القصة هدية؟",
        hint: "بنضيف صفحة هدية بأول الكتاب فيها كلامكم إنتوا.",
        options: { yes: "هدية", no: "لأ، إلنا" },
      },
      giftMessage: {
        label: "شو بدكم يكتب بصفحة الهدية؟",
        hint: "متل: «لأحلى ليان، من ماما وبابا — عيد ميلاد سعيد».",
      },
      // Asked directly above the photo picker, because it decides whether that
      // picker exists at all. "لأ" means no likeness is drawn, so no
      // photographs of a child are collected or uploaded.
      wantsAvatar: {
        label: "بدكم شخصية القصة تشبه طفلكم؟",
        hint: "إذا إي، منحتاج صور نرسم منها شخصية تشبهه. إذا لأ، منرسم شخصية عامة وما منحتاج ولا صورة.",
        options: {
          yes: "إي، بدنا ترسموه",
          no: "لأ، شخصية عامة بتكفي",
        },
      },
      parentName: { label: "اسمكم" },
      // A phone number, not "a number or a handle". This is the only way back
      // to a parent who has just paid, so it has to be something dialable —
      // the example lives in the hint rather than in a placeholder, because a
      // placeholder disappears the moment someone starts typing.
      contactHandle: {
        label: "رقم الواتساب",
        hint: "منرد عليكم عليه ومنرتب الدفع. مثال: 0791234567 — ومن برّا الأردن، مع رمز الدولة.",
      },
      notes: { label: "أي شي تاني بتحبوا نعرفه", hint: "" },
    },

    price: {
      title: "السعر",
      base: "القصة الأساسية (8 صفحات، PDF)",
      extraPages: "صفحات إضافية",
      printed: "نسخة مطبوعة",
      giftPage: "صفحة الهدية",
      total: "المجموع",
      // Timing is the next thing a parent wonders once they have a total.
      // {days} is `daysLabel()`, which carries Arabic number agreement.
      turnaround: "جاهزة خلال {days}",
      // Same four-form problem as the page counts: "خلال 2 أيام" is
      // ungrammatical. `unknown` keeps the site-wide bracket when the owner
      // has not set a turnaround yet.
      days: {
        one: "يوم واحد",
        two: "يومين",
        few: "{n} أيام",
        many: "{n} يوم",
        unknown: "[X] أيام",
      },
      // TODO(phase 2): drop this once the admin dashboard serves real amounts.
      pending: "الأسعار النهائية لسا عم نثبتها — منأكدها معكم بالرسالة قبل ما نبلش.",
    },

    photos: {
      title: "صور طفلكم",
      body: "منحتاج من صورة لـ ٣ صور واضحة لطفلكم من زوايا وتعابير مختلفة، منها نرسم شخصية تشبهه.",
      pick: "اختاروا الصور",
      addMore: "أضيفوا صور",
      range: "من صورة لـ ٣ صور",
      selectedOne: "صورة وحدة مختارة",
      // With a ceiling of 3 the dual is now reachable, and "2 صور" is
      // ungrammatical — the same agreement rule as the page counts.
      selectedTwo: "صورتين مختارتين",
      selectedMany: "{n} صور مختارة",
      remove: "إزالة",
      required: "اختاروا صورة وحدة على الأقل حتى نقدر نرسم شخصية تشبه طفلكم.",
      tooMany: "أقصى شي ٣ صور — ما انضافوا الباقي.",
      // What actually happens to them. These are photographs of a child, so
      // the answer belongs on the screen where they are handed over, not in a
      // policy page nobody opens.
      privacy:
        "الصور بتنبعت مع الطلب وبتستخدم بس لرسم شخصية طفلكم. بنحذفها بعد ما نسلّمكم الكتاب.",
    },

    review: {
      title: "راجعوا وابعتوا",
      body: "قبل ما تبعتوا، بتطلعلكم كل إجاباتكم لتراجعوها وتعدلوا أي شي.",
      incomplete: "في حقول ضرورية لسا فاضية — كمّلوها فوق وبعدين ابعتوا.",
      // TODO: turnaround is still [X] days everywhere on the site.
      afterNote: "بنرد عليكم خلال ساعات بفكرة القصة، وبنتفق على التفاصيل قبل ما نبلش.",

      dialogTitle: "راجعوا طلبكم",
      dialogLead: "تأكدوا إنو كل شي مظبوط. بتقدروا تعدلوا أي قسم قبل ما تبعتوا.",
      edit: "تعديل",
      close: "إغلاق",
      back: "رجوع للتعديل",
      empty: "—",

      // The button that actually files the order. WhatsApp comes after.
      placeOrder: "أرسلوا الطلب",
      sending: "عم نستلم طلبكم…",
      uploadingPhotos: "عم نرفع الصور… {done}%",
      whyWhatsapp:
        "بنستلم تفاصيل القصة والصور عنا مباشرة. بعدها بتفتحوا واتساب برسالة قصيرة عشان نرتب الدفع.",

      // After a successful send.
      doneTitle: "استلمنا طلبكم ✓",
      doneBody:
        "رقم الطلب {reference} — احتفظوا فيه. كل التفاصيل والصور وصلتنا، ما في إشي لازم تبعتوه.",
      donePhotos: "وصلتنا {n} صور مرجعية.",
      donePhotosNone: "ما وصلتنا صور بعد — ابعتوهم بالمحادثة.",
      doneLocked: "طلبكم محفوظ عنا بالشكل اللي بعتّوه. إذا بدكم تعدّلوا إشي، خبرونا بالواتساب.",
      // Zero photos is the *correct* outcome when no likeness was asked for,
      // so asking for them here would contradict the choice just made.
      donePhotosSkipped: "ما بدنا صور — القصة رح تكون بشخصية عامة.",
      donePhotosFailed: "الصور ما رفعت — ابعتوهم بالمحادثة ومنكمّل عادي.",
      send: "أرسلوا عبر واتساب",
      sendFallback: "افتحوا المحادثة",

      // When the order could not be filed. The parent must not be stranded:
      // WhatsApp still works, and the full details are copyable as a fallback.
      failedTitle: "ما قدرنا نستلم الطلب",
      failedBody:
        "في مشكلة بالاتصال عنا. جربوا كمان مرة، أو ابعتوا التفاصيل بواتساب ومنكمّل من هناك.",
      retry: "جربوا كمان مرة",
      copyFull: "انسخوا التفاصيل كاملة",
      copiedFull: "تم النسخ ✓",
      closed: "الطلبات موقوفة مؤقتاً — راسلونا وبنرتبها معكم.",
    },

    // Written in the first person: the parent presses send, the team reads it.
    // The greeting carries the name the way a person actually gives it; the
    // labelled rows under it are what gets acted on.
    // The last screen: the order is filed and the form behind it has been
    // wiped, so this is the parent's only remaining copy of the reference.
    thanks: {
      title: "شكراً إلكم!",
      body: "طلبكم وصلنا. منراسلكم على واتساب عشان نرتب الدفع ونبلّش بقصة طفلكم.",
      reference: "رقم طلبكم",
      another: "والنموذج تحت رجع فاضي — إذا بدكم تطلبوا قصة تانية لطفل تاني، تفضلوا.",
      whatsapp: "ما فتح واتساب؟ افتحوه من هون",
      close: "تمام",
      closeLabel: "سكروا",
    },

    whatsapp: {
      greeting: "مرحبا! أنا {parent}، وعبّيت طلب قصة لـ {child} عالموقع.",
      // Failure path only. No order was filed, so nobody should go looking for
      // one — and the parent has to know the details still need to be taken.
      notFiled: "بس ما زبط ينحفظ، فحبيت أراسلكم هون.",
      reference: "رقم الطلب",
      order: "الطلب",
      total: "المجموع",
      phone: "رقمي",
      closing: "بدي أكمّل الدفع من فضلكم.",
      closingNotFiled: "بقدر أبعتلكم كل التفاصيل هون.",
    },

    summary: {
      heading: "طلب قصة جديدة",
      child: "الطفل",
      story: "القصة",
      book: "الكتاب",
      price: "السعر",
      contact: "التواصل",
      photosPending: "الصور: رح تنبعت بنفس المحادثة.",
      photosSkipped: "الصور: مش مطلوبة — شخصية عامة.",
    },
  },

  gallery: {
    close: "إغلاق",
    previous: "السابق",
    next: "التالي",
    open: "افتحوا",
    zoom: "تكبير",
  },
};
