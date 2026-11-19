import { IMAGE_MANIFEST, type ImageAssetKey } from "@/data/image-manifest.generated";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface OptimizedImageProps {
  asset: ImageAssetKey;
  alt: string;
  className?: string;
  pictureClassName?: string;
  objectPosition?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Renders responsive AVIF -> WebP -> JPEG <picture> markup using build-time
 * sharp-optimized derivatives of authentic Karen Surgery photography.
 * Follows modern-web-guidance `optimize-image-priority`:
 * - `priority` (LCP only): fetchPriority="high", loading="eager"
 * - below-the-fold: loading="lazy" without fetchPriority="low"
 */
export function OptimizedImage({
  asset,
  alt,
  className = "",
  pictureClassName = "",
  objectPosition,
  priority = false,
  sizes,
}: OptimizedImageProps) {
  const entry = IMAGE_MANIFEST[asset];

  return (
    <picture className={pictureClassName || undefined}>
      <source srcSet={`${BASE_PATH}${entry.avif}`} type="image/avif" sizes={sizes} />
      <source srcSet={`${BASE_PATH}${entry.webp}`} type="image/webp" sizes={sizes} />
      <img
        src={`${BASE_PATH}${entry.jpg}`}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        style={objectPosition ? { objectPosition } : undefined}
        className={className}
      />
    </picture>
  );
}
