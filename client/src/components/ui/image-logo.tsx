import { cn } from "@/lib/utils";
import { Image } from "lucide-react";

interface ImageLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

export function ImageLogo({ src, alt, className, ...props }: ImageLogoProps) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted p-2 rounded", className)}>
        <Image className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  );
}