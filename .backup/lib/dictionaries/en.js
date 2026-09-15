// English copy. This is a rewrite, not a translation: the Arabic body copy is
// colloquial Jordanian, and rendering it literally reads stilted in English.
// The claims, structure and reading level are matched; the phrasing is not.
//
// Every placeholder in ar.js stays a placeholder here — prices, turnaround
// days, the age range, the refund policy and the testimonial are still TODO.
// Translating a bracket into a made-up number is the one thing not to do.

export const en = {
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
    note: "No complicated forms — it all happens in an Instagram message.",
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
    eyebrow: "A real example",
    title: "See how Layan's story turned out",
    lead: "Layan was afraid of the dark. We wrote her a story about a pair of red shoes that gave her courage — and she started going to bed happy.",
    bookTitleTop: "Layan's Red Shoes",
    bookTitleBottom: "and the Courage of the Night",
    bookFullTitle: "Layan's Red Shoes and the Courage of the Night",
    bookNote: "A fully personalised story — written and illustrated just for her, around something that really happened.",
    galleryHint: "Tap any page below to open it full size",
    // TODO: replace with a real, attributed parent testimonial.
    quote: "“She asks for it every single night… and tells her brother: that's me!”",
    quoteAttribution: "Layan's mother — Amman",
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
        a: "Usually around [X] days from the moment we have your child's details. If you need it for a particular occasion, tell us and we'll see what we can do.",
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
      "Cover of Layan's story: a small girl in a nightgown and glowing red shoes, standing under a star-filled night sky",
    chipTitle: "Layan's story",
    chipSub: "A real example of our work",
    chipBadge: "Fully personalised",
    // TODO: replace with real spreads photographed from Layan's printed book.
    spreads: {
      room: {
        category: "First page",
        title: "The night grew bigger than the room",
        body: "We started from the thing that actually frightened Layan — not from a generic lesson about fear.",
        alt: "Layan in bed at night, covers pulled up to her chin, stars glittering through the window",
      },
      shoes: {
        category: "The turn",
        title: "The red shoes under the bed",
        body: "Layan's real red shoes became the source of her courage inside the story.",
        alt: "Small red shoes on the bedroom floor, glowing with a warm golden light",
      },
      hallway: {
        category: "The adventure",
        title: "The first step into the hallway",
        body: "The hallway she used to avoid became the road to the adventure, with her own features on the character.",
        alt: "Layan walking down the hallway, her shoes glowing, a trail of golden stars behind her steps",
      },
      morning: {
        category: "The ending",
        title: "A brave girl's morning",
        body: "The story ends with Layan telling her mother — exactly the way it happened in real life.",
        alt: "Layan hugging her mother in a kitchen full of morning light",
      },
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
