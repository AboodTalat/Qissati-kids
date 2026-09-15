// English copy. This is a rewrite, not a translation: the Arabic body copy is
// colloquial Jordanian, and rendering it literally reads stilted in English.
// The claims, structure and reading level are matched; the phrasing is not.
//
// Every placeholder in ar.js stays a placeholder here — prices, turnaround
// days, the age range and the refund policy are still TODO.
// Translating a bracket into a made-up number is the one thing not to do.

export const en = {
  lang: "en",
  meta: {
    title: "Qissati | Your child, the hero of their own story",
    description:
      "Personalised illustrated storybooks for children, written from scratch around your child's name, personality and adventures. Delivered as a PDF or a printed copy.",
    ogTitle: "Qissati | Your child, the hero of their own story",
    ogDescription:
      "Personalised illustrated storybooks written around your child's name, personality and adventures.",
    ogLocale: "en_US",
  },

  brand: {
    // The Arabic wordmark is a logotype; in English it is set as the name.
    wordmark: "Qissati",
  },

  nav: {
    how: "How it works",
    tiers: "Story types",
    sample: "Sample story",
    pricing: "Pricing",
    faq: "FAQ",
    order: "Order a story",
  },

  header: {
    homeLabel: "Qissati — home",
    navLabel: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    order: "Order now",
    langLabel: "Language",
    langSwitchTo: "التبديل إلى العربية",
    langShortCurrent: "EN",
    langShortOther: "ع",
  },

  hero: {
    badge: "Handmade in Jordan",
    titleA: "Your child,",
    titleB: "the hero",
    titleC: "of their own story",
    lead: "A fully personalised illustrated storybook built around your child — their name, their personality, their adventures. Written from scratch, not a template with the name swapped out.",
    rolesPrefix: "This time, your child is",
    roles: [
      "a police officer",
      "a doctor",
      "an astronaut",
      "an explorer",
      "a pilot",
      "a scientist",
    ],
    ctaOrder: "Order your child's story",
    ctaSample: "See a sample story",
    reassure: "We reply on Instagram within hours — no commitment.",
  },

  trust: {
    label: "Why Qissati",
    items: [
      {
        title: "Written just for them",
        body: "Not a template with a name changed — the story is built around who your child actually is.",
      },
      {
        title: "PDF or printed copy",
        body: "Read it on your phone, or have a printed book delivered to your door.",
      },
      {
        title: "Ready in a few days",
        body: "From the moment you send us your child's details, the story is in your hands quickly.",
      },
    ],
  },

  how: {
    eyebrow: "Just three steps",
    title: "How the story comes together",
    lead: "From your first message to the book in your child's hands.",
    note: "A short form that takes minutes — the rest of the conversation happens in the chat.",
    steps: [
      {
        title: "Tell us about your child",
        body: "A short set of questions about their name, personality and what they love.",
      },
      {
        title: "Choose the kind of story",
        body: "A hero story (police officer, doctor, astronaut…) or a story with a purpose (courage, honesty, welcoming a new sibling…).",
      },
      {
        title: "Receive the story",
        body: "By WhatsApp or email, or as a printed copy delivered to your door.",
      },
    ],
  },

  tiers: {
    eyebrow: "Two options",
    title: "Choose how personal it gets",
    lead: "Both end in the same place: your child as the hero. The difference is how much of the story is written around them.",
    mostPopular: "Most requested",
    comingSoon: "Coming soon",
    cta: "Ask about this option",
    items: {
      avatar: {
        name: "Avatar only",
        sub: "Lower price",
        body: "Our loved, well-tested stories, with an illustrated character who looks like your child. Faster to prepare.",
        points: [
          "An illustrated character with your child's features",
          "Ready-made stories children already love",
          "Your child's name throughout the story",
          "Fastest turnaround",
        ],
      },
      custom: {
        name: "Fully personalised story",
        sub: "The special one",
        body: "A story written from scratch around your child's real personality and the details that make them them, illustrated with their features.",
        points: [
          "Written from scratch, just for your child",
          "Built on their real personality and details",
          "Their features drawn on every page",
          "A real moment or memory woven into the story",
        ],
      },
    },
  },

  sample: {
    eyebrow: "Illustrative sample",
    title: "See how Layan's details became a story",
    lead: "Layan is four, curious and kind, and dreams of becoming a vet. In her family garden in Amman, she finds a frightened kitten and uses her kindness, curiosity and colourful mismatched socks to help it feel safe.",
    bookTitleTop: "Layan the Veterinarian",
    bookTitleBottom: "and Her Colourful Socks",
    bookFullTitle: "Layan the Veterinarian and Her Colourful Socks",
    bookNote: "A fully personalised story built from fictional marketing order Q-000002: Layan's personality, her love of cats and colour, and two mismatched socks that become part of the solution.",
    galleryHint: "Tap any page below to open it full size",
    quote: "“For lovely Layan: always stay curious and kind, and let your colourful socks keep spreading joy among the cats you love.”",
    quoteAttribution: "Story dedication — illustrative sample Q-000002",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Simple and clear",
    note: "The final price depends on the kind of story (avatar or fully personalised) and the page count.",
    startsFrom: "From",
    currency: "JOD",
    cta: "Order this version",
    footnote: "Want a price for something specific? Message us and we'll get back to you quickly.",
    plans: {
      // TODO: replace [X] with the real prices before launch.
      pdf: {
        name: "PDF copy",
        price: "[X]",
        note: "Sent by WhatsApp or email",
        points: [
          "Ready to print or read on a phone",
          "Faster to prepare",
          "Print it whenever you like",
        ],
      },
      print: {
        name: "Printed copy",
        price: "[X]",
        note: "Delivery within Jordan",
        points: [
          "A high-quality printed book",
          "Gift-ready",
          "A keepsake that lasts",
        ],
      },
    },
  },

  faq: {
    eyebrow: "FAQ",
    title: "Anything on your mind?",
    lead: "If your question isn't here, message us on Instagram and we'll answer.",
    // TODO: fill in the bracketed values ([X] days, age range) before launch.
    items: [
      {
        q: "How long does a story take?",
        // [X] = the PDF, [Y] = the printed copy. The unit comes from
        // daysLabel, so the copy must not repeat "days" after the token.
        a: "The PDF is usually ready within [X], and the printed copy within [Y], from the moment we have your child's details. If you need it for a particular occasion, tell us and we'll see what we can do.",
      },
      {
        q: "What do you need to know about my child?",
        a: "Their name, age, two things about their personality, something they love, and the kind of story that suits them. A clear photo helps us draw a character who looks like them.",
      },
      {
        q: "Is it suitable for every age?",
        a: "The stories are made for children roughly [X-Y] years old. We adjust the length and the language to your child's age.",
      },
      {
        q: "What language is the story written in?",
        a: "Simple, easy-to-read Modern Standard Arabic — clear for the child and comfortable for a parent reading at bedtime. Ask us if you'd like it in English.",
      },
      {
        // TODO: the return / revision policy is not finalized yet.
        q: "What if I don't like the story?",
        a: "Our revision and refund policy is still being finalised. For now, if something isn't right, message us and we'll work on it with you until it is.",
      },
    ],
  },

  finalCta: {
    title: "Ready to make your child the hero?",
    lead: "Message us on Instagram and tell us about your child — we'll come back with a story idea made for them.",
    cta: "Get in touch",
  },

  footer: {
    tagline: "Your child, the hero of their own story",
    contactNote: "For orders and questions, message us on Instagram.",
    copyright: "© {year} Qissati — made with love in Jordan.",
  },

  book: {
    coverAlt:
      "Cover of Layan the Veterinarian: a girl in a yellow dress wearing one yellow and one green sock, seated in the family garden beside her white cat",
    chipTitle: "Layan's story",
    chipSub: "An illustrative marketing sample",
    chipBadge: "Fully personalised",
    spreads: {
      page1: {
        category: "The opening",
        title: "Sun and Mint",
        body: "In the family garden in Amman, Layan is playing with her white cat, Lawz. Layan always wears two different-coloured socks. Today, the yellow one is called Sun and the green one is called Mint. She dreams of becoming a veterinarian.",
        alt: "Layan seated on a low stone wall in an Amman garden, playing with her white cat Lawz, with one yellow and one green sock clearly visible",
      },
      page2: {
        category: "The discovery",
        title: "A sound behind the olive tree",
        body: "Suddenly, she hears a tiny meow from behind the olive tree. Curious, Layan runs over and finds a very small kitten hiding among the leaves, frightened and unsure how to come out.",
        alt: "Layan peeking around a thick olive-tree trunk at a tiny orange-striped kitten hiding in the low branches",
      },
      page3: {
        category: "The first attempt",
        title: "Layan begins her mission",
        body: "Layan decides to begin her work as a veterinarian. She edges closer and says gently, “Come here, little one. I'm here to help.” But the kitten hisses and backs away while Lawz watches quietly.",
        alt: "Layan crouching and reaching one hand gently toward a hesitant orange kitten in the bushes, with Lawz seated behind her",
      },
      page4: {
        category: "The plan",
        title: "Safety comes first",
        body: "Layan thinks about how to reassure the kitten. She knows a good veterinarian helps an animal feel safe first, so she brings over a small basket lined with a blanket and places it nearby.",
        alt: "Layan's hands placing a small woven basket lined with a blue blanket on the garden grass beside the bushes",
      },
      page5: {
        category: "The idea",
        title: "Colour becomes the solution",
        body: "Layan notices that the kitten keeps watching her colourful socks. She loves colours and cats, and realises that her friends Sun and Mint might be the solution.",
        alt: "Layan looking down at her mismatched yellow and green socks with a clever smile while her white cat stands beside her",
      },
      page6: {
        category: "The experiment",
        title: "Sun and Mint start moving",
        body: "Layan takes off her shoes and gently wiggles her feet to attract the kitten's attention. “Look,” she says, “Sun wants to play with you, and Mint will keep you warm.”",
        alt: "Layan seated on the grass wiggling her yellow and green socks after taking off her shoes as the kitten peeks from the bushes",
      },
      page7: {
        category: "The first trust",
        title: "A tiny paw reaches for Sun",
        body: "The little kitten forgets its fear as the colours move gently. It reaches out a tiny paw and tries to catch the yellow sock, Sun, while Lawz offers a small encouraging meow.",
        alt: "An orange kitten lifting one paw to bat at Layan's bright yellow sock while the white cat watches happily behind",
      },
      page8: {
        category: "The solution",
        title: "Step by step to the basket",
        body: "With a clever move, Layan uses her socks to guide the kitten step by step toward the cosy basket. The kitten follows Mint until it jumps inside and settles safely.",
        alt: "Layan seated by her colourful socks after the orange kitten has reached the lined basket, with Lawz beside her",
      },
      page9: {
        category: "The result",
        title: "Mission accomplished",
        body: "Layan smiles as the kitten warms up and purrs inside the basket beside the mint planter. Her mission has worked, and the kitten is happy in a safe, warm place in the garden.",
        alt: "Layan smiling beside a basket where the orange kitten sleeps on a blue blanket while Lawz gently sniffs the basket",
      },
      page10: {
        category: "The ending",
        title: "A veterinarian's well-earned rest",
        body: "Layan settles on the green grass with Lawz sleeping warmly on her tummy. She lifts her feet and lets Sun and Mint greet each other happily. Even a veterinarian needs a little rest after a job well done.",
        alt: "Layan lying in the garden at sunset with her yellow and green socks raised in the air and Lawz asleep on her tummy",
      },
    },
  },

  // ── Order page ────────────────────────────────────────────────────────
  // The fields here exist to fill the variables in the AI prompt templates
  // (see CLAUDE.md, "The order page"). Renaming a key without updating the
  // prompt that consumes it is how this silently breaks.
  order: {
    metaTitle: "Order your child's story | Qissati",
    metaDescription:
      "Tell us about your child and the kind of story you want, and we'll come back with a story idea made for them.",
    kicker: "Story order",
    title: "Tell us about your child",
    lead: "Everything here goes into writing the story and drawing a character who looks like them. Take your time — only the starred questions are required.",
    backToHome: "Back to the homepage",
    // The page's whole reason for asking this much. It is the same promise the
    // hero and the trust bar make; here it explains why the questions exist.
    promise: {
      title: "Not a template",
      body: "Every answer here goes into the story itself. There is no ready-made story with the name swapped out — it is written from scratch around your child: their personality, their habits, and the one detail that is theirs alone.",
    },
    required: "required",
    // Short on purpose: it lands in a one-line slot that `reserveError` holds
    // open, and a second line would push the field beside it down again.
    invalidPhone: "Not a valid number",
    invalidAge: "Not a valid age",
    invalidChoice: "Not a valid choice",
    tooLong: "Answer is too long",
    optional: "optional",

    draft: {
      saved:
        "Your answers are saved automatically on this device and stay here if you refresh. You'll only need to choose the photos again after a refresh.",
      reset: "Start over",
      resetConfirm: "Clear every answer and selected photo and start over?",
    },

    steps: {
      child: { n: "01", title: "Your child", note: "What the whole story gets built on." },
      story: { n: "02", title: "The story", note: "Its kind, its mood, its language." },
      book: { n: "03", title: "The book", note: "How personal it gets, and what you receive." },
      contact: { n: "04", title: "Reaching you", note: "Last step — the rest happens in the chat." },
    },

    fields: {
      childName: { label: "Your child's name", hint: "Whatever you call them at home — that's how it appears in the book." },
      childAge: { label: "Age", hint: "In whole years, from 0 to 18." },
      gender: { label: "Boy or girl", options: { boy: "Boy", girl: "Girl" } },
      trait1: { label: "One thing about their personality", hint: "For example: curious, brave, affectionate." },
      trait2: { label: "And another", hint: "For example: a little stubborn, shy, always laughing." },
      favourite: { label: "Something they love", hint: "Cats, cars, the sea, dinosaurs…" },
      sidekick: {
        label: "A sibling, friend or pet's name",
        hint: "If you'd like someone alongside them in the story.",
      },
      // Asked because of Arabic, not English: the story's own language is a
      // separate question, so a parent reading this page in English may still
      // be ordering an Arabic book — where the pronouns and adjective endings
      // depend on which of these the name is.
      sidekickRelation: {
        label: "Who are they to your child?",
        hint: "We need it to get the wording right in the story.",
        placeholder: "Choose…",
        options: {
          brother: "Brother",
          sister: "Sister",
          friendBoy: "A friend (boy)",
          friendGirl: "A friend (girl)",
          pet: "Pet",
        },
      },
      sidekickAge: {
        label: "How old are they?",
        hint: "In whole years (0–120), so we write and illustrate them at the right age.",
      },
      petDescription: {
        label: "Describe the pet",
        hint: "Tell us the animal type and colour, plus the breed if you know it and any distinctive markings. For example: “a small grey cat with a white chest and green eyes.”",
      },
      quirk: {
        label: "A habit or quirk that's theirs alone",
        hint: "This is the most important question here. We want something they actually do — not a general trait. For example: “insists on wearing her red rain boots, even to bed.” We weave it through the story in more than one place, and it is what makes the story theirs.",
      },
      storyType: {
        label: "Kind of story",
        options: {
          goal: "A story with a purpose",
          role: "A hero story",
        },
        hints: {
          goal: "Works on something specific: fear of the dark, courage, welcoming a new sibling…",
          role: "Your child becomes what they dream of: a police officer, a doctor, an astronaut…",
        },
      },
      storyChoice: {
        label: "What specifically?",
        hintGoal: "For example: afraid of the dark.",
        hintRole: "For example: wants to be a police officer.",
      },
      // Where the story happens. Optional, but it is the difference between a
      // story set in their world and one set nowhere. The placeholder carries
      // the examples because the answer is short enough to sit in the field.
      setting: {
        label: "Where does the story happen?",
        hint: "Somewhere real from their life makes the story feel like theirs.",
        placeholder: "Our home in Amman, Grandma's house in Irbid, the Dead Sea…",
      },
      // The one field that exists to keep something OUT of the story.
      avoid: {
        label: "Anything we should avoid?",
        hint: "Something sensitive we shouldn't touch — a pet that died recently, someone not in their life right now, a fear you'd rather we didn't name.",
      },
      tone: {
        label: "Mood of the story",
        options: { funny: "Funny", sweet: "Sweet and gentle", adventurous: "Adventurous" },
      },
      language: {
        label: "Language of the story",
        options: {
          msa: "Simple Modern Standard Arabic",
          ammiya: "Jordanian Arabic",
          english: "English",
        },
      },
      pages: {
        label: "Number of pages",
        // Same shape as ar.js, which needs four forms; English only needs two.
        unit: { one: "{n} page", two: "{n} pages", few: "{n} pages", many: "{n} pages" },
      },
      format: { label: "What you receive" },
      // TODO(phase 2): the amounts come from the admin dashboard, not the code.
      addon: {
        included: "Included",
        extra: "+[X] JOD",
        // The 8-page option is the base story itself, so it adds nothing. A
        // bare price beside "10 pages +[X]" read as a separate charge.
        includedInBase: "Included in the base price",
      },
      // Was one free-text "City or area" box, which nobody could dispatch a
      // courier from. Now two dependent selects, so the label splits with them.
      city: {
        label: "City",
        hint: "For delivery within Jordan.",
        placeholder: "Choose a city…",
      },
      area: {
        label: "Area",
        hint: "The area is enough — we agree the exact address in the chat.",
        placeholder: "Choose an area…",
      },
      // Not a story input — it fills no placeholder in the AI prompts. It tells
      // us what the book is for, which is what the gift page should sound like,
      // and it is what a future birthday reminder would be keyed on.
      occasion: {
        label: "The occasion",
        hint: "It helps us suggest what the gift page should say.",
        options: {
          birthday: "Birthday",
          eid: "Eid",
          newSibling: "A new sibling",
          justBecause: "Just because",
        },
      },
      isGift: {
        label: "Is this a gift?",
        hint: "We add a gift page at the front of the book with your own words on it.",
        options: { yes: "Yes, it's a gift", no: "No, it's for us" },
      },
      giftMessage: {
        label: "What should the gift page say?",
        hint: "For example: “For our wonderful Layan, from Mum and Dad — happy birthday.”",
      },
      // Asked directly above the photo picker, because it decides whether that
      // picker exists at all. "No" means no likeness is drawn, so no
      // photographs of a child are collected or uploaded.
      wantsAvatar: {
        label: "Should the character look like your child?",
        hint: "If yes, we need photos to draw them from. If no, we draw a general character and need no photos at all.",
        options: {
          yes: "Yes, draw them",
          no: "No, a general character is fine",
        },
      },
      parentName: { label: "Your name" },
      // A phone number, not "a number or a handle". This is the only way back
      // to a parent who has just paid, so it has to be something dialable —
      // the example lives in the hint rather than in a placeholder, because a
      // placeholder disappears the moment someone starts typing.
      contactHandle: {
        label: "WhatsApp number",
        hint: "Where we reply and arrange payment. Example: 0791234567 — from abroad, include your country code.",
      },
      notes: { label: "Anything else we should know", hint: "" },
    },

    price: {
      title: "Price",
      base: "Base story (8 pages, PDF)",
      extraPages: "Extra pages",
      printed: "Printed copy",
      giftPage: "Gift page",
      total: "Total",
      // Timing is the next thing a parent wonders once they have a total.
      turnaround: "Ready in {days}",
      // English needs only one plural, but the table keeps the same shape as
      // ar.js so `daysLabel()` has one code path. `unknown` keeps the
      // site-wide bracket when the owner has not set a turnaround yet.
      days: {
        one: "{n} day",
        two: "{n} days",
        few: "{n} days",
        many: "{n} days",
        unknown: "[X] days",
      },
      // TODO(phase 2): drop this once the admin dashboard serves real amounts.
      pending: "Final pricing is still being set — we confirm it with you in the chat before we start.",
    },

    photos: {
      title: "Photos of your child",
      body: "We need 1 to 3 clear photos from different angles and expressions, so we can draw a character who looks like them.",
      pick: "Choose photos",
      addMore: "Add more",
      range: "1 to 3 photos",
      selectedOne: "1 photo selected",
      // English needs no dual, but the key exists so both dictionaries have
      // the same shape and PhotoPicker has one code path.
      selectedTwo: "2 photos selected",
      selectedMany: "{n} photos selected",
      remove: "Remove",
      required: "Choose at least one photo so we can draw a character who looks like your child.",
      tooMany: "3 photos maximum — the rest weren't added.",
      // What actually happens to them. These are photographs of a child, so
      // the answer belongs on the screen where they are handed over, not in a
      // policy page nobody opens.
      privacy:
        "The photos are sent with your order and used only to draw your child's character. We delete them once the book is delivered.",
    },

    review: {
      title: "Check it over and send",
      body: "Before anything is sent, you'll see all your answers so you can read them back and change anything.",
      incomplete: "Some required answers are still blank — fill them in above, then send.",
      // TODO: turnaround is still [X] days everywhere on the site.
      afterNote: "We reply within hours with a story idea, and we agree the details with you before we start.",

      dialogTitle: "Review your order",
      dialogLead: "Make sure everything reads right. You can edit any section before sending.",
      edit: "Edit",
      close: "Close",
      back: "Back to editing",
      empty: "—",

      // The button that actually files the order. WhatsApp comes after.
      placeOrder: "Place the order",
      sending: "Filing your order…",
      uploadingPhotos: "Sending the photos… {done}%",
      whyWhatsapp:
        "The details and the photos come straight to us. WhatsApp opens afterwards with a short message, just to arrange payment.",

      // After a successful send.
      doneTitle: "We've got your order ✓",
      doneBody:
        "Your reference is {reference} — keep it handy. Everything reached us, so there's nothing you need to send on.",
      donePhotos: "{n} reference photos arrived.",
      donePhotosNone: "No photos yet — send them in the chat.",
      doneLocked: "Your order is saved exactly as you sent it. To change anything, just tell us on WhatsApp.",
      // Zero photos is the *correct* outcome when no likeness was asked for,
      // so asking for them here would contradict the choice just made.
      donePhotosSkipped: "No photos needed — the story uses a general character.",
      donePhotosFailed: "The photos didn't upload — send them in the chat and we'll carry on.",
      send: "Send on WhatsApp",
      sendFallback: "Open the chat",

      // When the order could not be filed. The parent must not be stranded:
      // WhatsApp still works, and the full details are copyable as a fallback.
      failedTitle: "We couldn't file your order",
      failedBody:
        "Something went wrong at our end. Try again, or send the details on WhatsApp and we'll pick it up from there.",
      retry: "Try again",
      copyFull: "Copy the full details",
      copiedFull: "Copied ✓",
      closed: "Orders are paused right now — message us and we'll sort it out with you.",
    },

    // Written in the first person: the parent presses send, the team reads it.
    // The greeting carries the name the way a person actually gives it; the
    // labelled rows under it are what gets acted on.
    // The last screen: the order is filed and the form behind it has been
    // wiped, so this is the parent's only remaining copy of the reference.
    thanks: {
      title: "Thank you!",
      body: "Your order is with us. We'll message you on WhatsApp to arrange payment and get your child's story started.",
      reference: "Your order number",
      another: "The form below is empty again — if you'd like a second story for another child, go ahead.",
      whatsapp: "WhatsApp didn't open? Open it here",
      close: "Done",
      closeLabel: "Close",
    },

    whatsapp: {
      greeting: "Hi! I'm {parent} — I've just filled in an order for a story for {child}.",
      // Failure path only. No order was filed, so nobody should go looking for
      // one — and the parent has to know the details still need to be taken.
      notFiled: "It didn't save on the site, though, so I'm messaging you here.",
      reference: "Order no.",
      order: "Order",
      total: "Total",
      phone: "My number",
      closing: "I'd like to go ahead and pay, please.",
      closingNotFiled: "Happy to send you all the details here.",
    },

    summary: {
      heading: "New story order",
      child: "Child",
      story: "Story",
      book: "Book",
      price: "Price",
      contact: "Contact",
      photosPending: "Photos: to be sent in this chat.",
      photosSkipped: "Photos: not needed — general character.",
    },
  },

  gallery: {
    close: "Close",
    previous: "Previous",
    next: "Next",
    open: "Open",
    zoom: "Zoom",
  },
};
