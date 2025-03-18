import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onChange: (file: File | null) => void;
  onDelete?: () => void;
  preview?: string | null;
  acceptedTypes?: string;
  maxFiles?: number;
}

export function ImageUpload({ 
  onChange,
  onDelete,
  preview,
  acceptedTypes = "image/*",
  maxFiles = 1
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > maxFiles) {
      alert(`En fazla ${maxFiles} dosya yükleyebilirsiniz`);
      return;
    }

    onChange(maxFiles === 1 ? files[0] : null);
  }, [onChange, maxFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > maxFiles) {
      alert(`En fazla ${maxFiles} dosya yükleyebilirsiniz`);
      return;
    }

    onChange(maxFiles === 1 ? files[0] : null);
  }, [onChange, maxFiles]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center",
          isDragging && "border-primary bg-primary/10",
          "transition-colors duration-200"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedTypes}
          className="hidden"
          id="image-upload"
          onChange={handleFileSelect}
        />
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Logo seçmek için tıklayın veya sürükleyin
          </div>
        </label>
      </div>

      {preview && (
        <div className="relative w-fit mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="h-20 w-auto"
          />
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2"
              onClick={onDelete}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}