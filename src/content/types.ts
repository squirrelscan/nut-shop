export type NutKey =
  | "almond"
  | "cashew"
  | "walnut"
  | "pecan"
  | "hazelnut"
  | "peanut"
  | "brazil"
  | "pistachio"
  | "pine"
  | "mixed";

export type Variant = { label: string; weightG: number; priceCents: number };

export type Nutrition = {
  energyKcal: number;
  fatG: number;
  saturatesG: number;
  carbsG: number;
  sugarsG: number;
  fibreG: number;
  proteinG: number;
  saltG: number;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  nut: NutKey;
  tagline: string;
  metaDescription: string;
  description: string[];
  variants: Variant[];
  ingredients: string;
  allergens: string[];
  mayContain: string;
  nutrition: Nutrition;
  storage: string;
  posts: string[];
  contains?: string[];
};

export type Category = {
  slug: string;
  name: string;
  seoTitle: string;
  metaDescription: string;
  intro: string;
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  topic: "guides" | "recipes" | "storage" | "sourcing";
  relatedProducts: string[];
  html: string;
  words: number;
};
