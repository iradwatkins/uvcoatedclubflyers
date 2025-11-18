import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  imageUrl?: string | null;
  productName: string;
  variant?: 'hero' | 'card' | 'thumbnail' | 'mini';
  className?: string;
  priority?: boolean;
}

const VARIANT_SIZES = {
  hero: { width: 600, height: 400 },
  card: { width: 300, height: 200 },
  thumbnail: { width: 80, height: 80 },
  mini: { width: 60, height: 60 },
};

export function ProductImage({
  imageUrl,
  productName,
  variant = 'card',
  className,
  priority = false,
}: ProductImageProps) {
  const { width, height } = VARIANT_SIZES[variant];
  const imageSrc = imageUrl || '/images/placeholders/placeholder-product.svg';

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        variant === 'hero' && 'rounded-lg',
        variant === 'card' && 'rounded-md',
        (variant === 'thumbnail' || variant === 'mini') && 'rounded',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <Image
        src={imageSrc}
        alt={productName}
        fill
        className="object-cover"
        sizes={
          variant === 'hero'
            ? '(max-width: 768px) 100vw, 600px'
            : variant === 'card'
              ? '(max-width: 768px) 100vw, 300px'
              : `${width}px`
        }
        priority={priority}
      />
    </div>
  );
}
