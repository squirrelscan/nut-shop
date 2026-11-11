import { fault } from "../../faults/runtime";
import type { Product } from "#/content/types";

const ALT_BY_CATEGORY: Record<string, string> = {
  "raw-nuts": "A bowl of whole raw nuts in a drawn style",
  "roasted-nuts": "A bowl of golden roasted nuts in a drawn style",
  "nut-butters": "A glass jar of nut butter with a nut on the label",
  "trail-mixes": "A bowl of mixed nuts and fruit in a drawn style",
  "gift-boxes": "A wrapped gift box topped with a few nuts",
  baking: "A bowl of nuts ready for baking in a drawn style",
};

/** Product illustration. Faults: image-missing-alt (raw-almonds), image-missing-dimensions (raw-cashews). */
export function ProductImage({
  product,
  width = 400,
  height = 300,
  priority = false,
  eager = false,
  decorative = false,
  className,
}: {
  product: Product;
  width?: number;
  height?: number;
  priority?: boolean;
  eager?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const noAlt = fault("image-missing-alt") && product.slug === "raw-almonds";
  const noDims = fault("image-missing-dimensions") && product.slug === "raw-cashews";
  const props: Record<string, unknown> = {
    src: `/img/products/${product.slug}.svg`,
    loading: priority || eager ? "eager" : "lazy",
    decoding: "async",
    className,
  };
  if (priority) props.fetchPriority = "high";
  if (!noAlt)
    props.alt = decorative
      ? ""
      : (ALT_BY_CATEGORY[product.category] ?? "An illustrated bowl of nuts");
  if (!noDims) {
    props.width = width;
    props.height = height;
  }
  return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
}

export function Img({
  src,
  alt,
  width,
  height,
  priority = false,
  eager = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority || eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
