/** Copy for the static pages. Original text; the demo notice is added by the footer. */
export type Section = { heading: string; body: string[] };
export type StaticPage = {
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: Section[];
};

export const STATIC_PAGES: Record<
  "about" | "shipping" | "privacy" | "terms" | "giftGuide" | "contact",
  StaticPage
> = {
  about: {
    path: "/about",
    title: "About The Nut Shop",
    description:
      "The story of The Nut Shop: a fictional small shop for nuts, nut butters, trail mixes and gift boxes, built as a demo to test website audits.",
    h1: "About The Nut Shop",
    lead: "We are a pretend shop with real opinions about almonds.",
    sections: [
      {
        heading: "What this site is",
        body: [
          "The Nut Shop is a demo store run by squirrelscan. It looks and behaves like a small independent shop: product pages, a journal, policies and a cart. It exists so that website audits have something realistic to look at, and so that we can break it on purpose and fix it again.",
          "Nothing here is for sale. There is no checkout, no payment form and no account system. Every product, price, recipe and policy was written for the demo.",
        ],
      },
      {
        heading: "What we write about",
        body: [
          "The catalogue covers raw and roasted nuts, nut butters, trail mixes, baking nuts and gift boxes. The journal covers roasting, storage, baking and a few explainers about where nuts come from. We try to keep every claim general and checkable, and we link to public reference pages where it helps.",
          "If you want to see how the site is put together, the audit tool that checks it is called squirrelscan.",
        ],
      },
      {
        heading: "Business details",
        body: [
          "Registered business: Demo Nut Trading Co (fictional). This is not a real company, and no registration number, address or phone number exists.",
        ],
      },
    ],
  },
  contact: {
    path: "/contact",
    title: "Contact The Nut Shop",
    description:
      "How to reach The Nut Shop demo store by email. There is no contact form and no phone line: this is a demo site and nothing is for sale.",
    h1: "Contact us",
    lead: "Email is the only way to reach us.",
    sections: [
      {
        heading: "Email",
        body: [
          "The address is shown below. We do not run a contact form on this demo, so the site never collects your name or details.",
        ],
      },
      {
        heading: "Before you write",
        body: [
          "This is a demo store, so there are no orders to chase and nothing to return. If you are auditing this site and found something odd, it may be one of our deliberate test faults.",
        ],
      },
    ],
  },
  shipping: {
    path: "/shipping-and-returns",
    title: "Shipping and returns",
    description:
      "Shipping and returns policy for The Nut Shop, written for a demo store: what the policy would say if nuts were really for sale here.",
    h1: "Shipping and returns",
    lead: "A sample policy for a shop that does not ship.",
    sections: [
      {
        heading: "Shipping",
        body: [
          "In a real shop this page would explain delivery areas, carriers and timings. Here it shows the structure shoppers expect: a flat delivery fee below a free-delivery threshold, orders packed on weekdays, and tracking by email.",
          "Because this is a demo store, no order is ever placed and nothing is packed or posted.",
        ],
      },
      {
        heading: "Returns",
        body: [
          "A real policy would say how long customers have to return unopened goods and how refunds are issued. Food has special rules, and opened packs of nuts usually cannot be returned for hygiene reasons.",
          "Again, nothing is sold here, so there is nothing to return.",
        ],
      },
      {
        heading: "Damaged or wrong items",
        body: [
          "A real shop would ask customers to email a photo within a few days. Our contact details are on the contact page.",
        ],
      },
    ],
  },
  privacy: {
    path: "/privacy",
    title: "Privacy policy",
    description:
      "Privacy policy for The Nut Shop demo store: the site collects no personal data, sets no tracking cookies and has no accounts or forms.",
    h1: "Privacy policy",
    lead: "Short, because we collect nothing.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "The site has no accounts, no contact form and no payment form. The newsletter box is a non-submitting demo and sends nothing. We do not set tracking cookies or run advertising scripts.",
          "The cart is kept in your own browser storage so that it survives a page reload. It never leaves your device.",
        ],
      },
      {
        heading: "Server logs",
        body: [
          "Like any website, the host may keep standard access logs (IP address, time, page requested) for security and operations. This demo does not use them for any other purpose.",
        ],
      },
      {
        heading: "Questions",
        body: ["Email us using the address on the contact page."],
      },
    ],
  },
  terms: {
    path: "/terms",
    title: "Terms of use",
    description:
      "Terms of use for The Nut Shop demo website: the site is a test bed, nothing is for sale, and content is provided as is for audit testing.",
    h1: "Terms of use",
    lead: "Plain terms for a demo site.",
    sections: [
      {
        heading: "Demo only",
        body: [
          "The Nut Shop is a demonstration website. No goods or services are offered and no contract of sale can be formed through it. Prices and product details are fictional.",
        ],
      },
      {
        heading: "Content",
        body: [
          "Text and illustrations were created for this demo. Recipes and storage advice are general information and not professional or medical advice. Always read the label of any food you buy elsewhere and seek professional advice about allergies.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We change this site on purpose and often, including introducing and fixing deliberate faults. Pages, links and headers may be broken from time to time.",
        ],
      },
    ],
  },
  giftGuide: {
    path: "/gift-guide",
    title: "Nut gift guide",
    description:
      "A short guide to choosing a nut gift: which boxes suit which people, how to mix flavours and what to avoid, with links to our gift boxes.",
    h1: "The nut gift guide",
    lead: "How to pick something people will actually eat.",
    sections: [
      {
        heading: "For the person who bakes",
        body: [
          "Pair ground and flaked almonds with chopped walnuts and pecan pieces. The baking range is easy to use up and rarely duplicates what is already in the cupboard.",
        ],
      },
      {
        heading: "For the snacker",
        body: [
          "Go for a selection of roasted nuts and a trail mix. Our tasting flight box lets people compare flavours side by side.",
        ],
      },
      {
        heading: "For the spreader",
        body: [
          "A trio of nut butters is a reliable hit. Add a small jar of the hazelnut cocoa spread if there are children in the house.",
        ],
      },
      {
        heading: "Check for allergies first",
        body: [
          "Every box contains nuts. If you are not sure about the recipient, ask first, and read the allergen information on each product page.",
        ],
      },
    ],
  },
};

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is anything on The Nut Shop really for sale?",
    a: "No. The Nut Shop is a demo store run by squirrelscan to test website audits. There is no checkout and no payment form.",
  },
  {
    q: "Why does the cart end on a demo page?",
    a: "The cart lives in your browser so you can see how a basket behaves. The checkout button leads to a page that says orders are not taken.",
  },
  {
    q: "Do you collect any personal data?",
    a: "No. There are no accounts, forms or tracking cookies. The newsletter box is a non-submitting demo.",
  },
  {
    q: "Are the nutrition tables exact?",
    a: "They show typical values per 100 g for the kind of product described. Because the products are fictional, treat them as illustrative only.",
  },
  {
    q: "How should I store nuts at home?",
    a: "Keep them in an airtight container somewhere cool, dry and dark. For longer keeping, the fridge or freezer slows the oils going off. Our journal has a full guide to storing nuts.",
  },
  {
    q: "Which products contain allergens?",
    a: "Every product contains nuts or peanuts. Each product page lists allergens and a may-contain statement. Always read the label and seek professional advice for medical questions.",
  },
  {
    q: "Why might a page on this site be broken?",
    a: "We deliberately break and fix the site to test audit tools. If something looks wrong, it may be a planned test.",
  },
];
