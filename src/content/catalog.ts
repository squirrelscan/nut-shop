import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    slug: "raw-nuts",
    name: "Raw nuts",
    metaDescription:
      "Raw almonds, cashews, walnuts, pecans, hazelnuts and Brazil nuts: plain, unroasted and unsalted, packed in resealable bags.",
    intro:
      "Plain, unroasted and unsalted. Raw nuts are the starting point for snacking, baking, soaking and roasting at home.",
  },
  {
    slug: "roasted-nuts",
    name: "Roasted nuts",
    metaDescription:
      "Dry-roasted, salted, smoked, honey-roasted and glazed nuts: small-batch flavours from almonds, cashews, peanuts and pecans.",
    intro:
      "Roasted in small batches until fragrant, then seasoned. From a plain dry roast to maple glaze and chilli lime.",
  },
  {
    slug: "nut-butters",
    name: "Nut butters",
    metaDescription:
      "Smooth and crunchy peanut butter, almond, cashew, hazelnut cocoa and pistachio spreads, stirred up in small jars.",
    intro:
      "Ground slowly from roasted nuts into spreads for toast, porridge, sauces and spoons. Natural oil separation is normal: stir and enjoy.",
  },
  {
    slug: "trail-mixes",
    name: "Trail mixes",
    metaDescription:
      "Trail mixes for hikes, desks and lunchboxes: classic, tropical, chocolate orchard, spicy and breakfast crunch blends.",
    intro:
      "Blends built around texture and balance: something crunchy, something chewy, something a little sweet.",
  },
  {
    slug: "gift-boxes",
    name: "Gift boxes",
    metaDescription:
      "Nut gift boxes and hampers: small boxes, tasting flights, nut butter trios and festive collections, ready to give.",
    intro:
      "Boxes of our favourites, arranged so the gift is the first thing people reach for. (Demo store: nothing ships.)",
  },
  {
    slug: "baking",
    name: "Baking nuts",
    metaDescription:
      "Ground almonds, flaked almonds, chopped walnuts, pecan pieces, hazelnut flour and pine nuts for baking and cooking.",
    intro: "Ground, flaked and chopped nuts for cakes, crumbles, pestos and pie crusts.",
  },
];

export const NUT_WIKI: Record<string, { label: string; href: string }> = {
  almond: { label: "Almond", href: "https://en.wikipedia.org/wiki/Almond" },
  cashew: { label: "Cashew", href: "https://en.wikipedia.org/wiki/Cashew" },
  walnut: { label: "Walnut", href: "https://en.wikipedia.org/wiki/Walnut" },
  pecan: { label: "Pecan", href: "https://en.wikipedia.org/wiki/Pecan" },
  hazelnut: { label: "Hazelnut", href: "https://en.wikipedia.org/wiki/Hazelnut" },
  peanut: { label: "Peanut", href: "https://en.wikipedia.org/wiki/Peanut" },
  brazil: { label: "Brazil nut", href: "https://en.wikipedia.org/wiki/Brazil_nut" },
  pistachio: { label: "Pistachio", href: "https://en.wikipedia.org/wiki/Pistachio" },
  pine: { label: "Pine nut", href: "https://en.wikipedia.org/wiki/Pine_nut" },
  mixed: { label: "Nut (fruit)", href: "https://en.wikipedia.org/wiki/Nut_(fruit)" },
};

export const ALLERGY_LINKS = [
  {
    label: "US FDA: Food allergies",
    href: "https://www.fda.gov/food/food-labeling-nutrition/food-allergies",
  },
  {
    label: "UK Food Standards Agency: Food allergy and intolerance",
    href: "https://www.food.gov.uk/safety-hygiene/food-allergy-and-intolerance",
  },
];
