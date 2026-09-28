/**
 * High-Performance Image Optimization Utility
 * Enforces WebP/AVIF format conversion, responsive srcsets, explicit width/height to eliminate CLS,
 * and lazy/async decoding.
 */

export interface OptimizedImageAttrs {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function getOptimizedImageUrl(
  rawUrl: string | undefined | null,
  targetWidth: number = 800,
  quality: number = 80
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80&fm=webp';
  }

  const trimmed = rawUrl.trim();

  // Unsplash images: optimize with auto=format, fm=webp, width, and quality
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('fm', 'webp');
      urlObj.searchParams.set('w', String(targetWidth));
      urlObj.searchParams.set('q', String(quality));
      return urlObj.toString();
    } catch {
      return trimmed;
    }
  }

  // Cloudinary images
  if (trimmed.includes('res.cloudinary.com')) {
    return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${targetWidth}/`);
  }

  return trimmed;
}

export function getResponsiveImageProps(
  rawUrl: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    isPriority?: boolean;
    sizes?: string;
  } = {}
): OptimizedImageAttrs {
  const {
    width = 800,
    height = 450,
    isPriority = false,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px',
  } = options;

  const baseSrc = getOptimizedImageUrl(rawUrl, width);

  // Generate responsive srcset for Unsplash
  let srcSet: string | undefined = undefined;
  if (rawUrl && rawUrl.includes('images.unsplash.com')) {
    const src400 = getOptimizedImageUrl(rawUrl, 400);
    const src800 = getOptimizedImageUrl(rawUrl, 800);
    const src1200 = getOptimizedImageUrl(rawUrl, 1200);
    srcSet = `${src400} 400w, ${src800} 800w, ${src1200} 1200w`;
  }

  return {
    src: baseSrc,
    srcSet,
    sizes,
    width,
    height,
    loading: isPriority ? 'eager' : 'lazy',
    decoding: 'async',
    fetchPriority: isPriority ? 'high' : 'auto',
  };
}
