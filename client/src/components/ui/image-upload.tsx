import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
}

export function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  acceptedTypes = "image/*"
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
    if (files.length + value.length > maxFiles) {
      alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    handleFiles(files);
  }, [value, maxFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + value.length > maxFiles) {
      alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    handleFiles(files);
  }, [value, maxFiles]);

  const handleFiles = (files: File[]) => {
    // For single file upload (like logo), just emit the file directly
    if (maxFiles === 1) {
      onChange([files[0].name]); // We'll just use the filename as a placeholder
      return;
    }

    // For multiple files, create temporary URLs
    const urls = files.map(file => URL.createObjectURL(file));
    onChange([...value, ...urls]);
  };

  const removeImage = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

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
          multiple={maxFiles > 1}
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
            {maxFiles === 1 ? (
              "Logo seçmek için tıklayın veya sürükleyin"
            ) : (
              "Fotoğrafları buraya sürükleyin veya seçmek için tıklayın"
            )}
          </div>
          {maxFiles > 1 && (
            <div className="text-xs text-muted-foreground mt-1">
              (Maksimum {maxFiles} fotoğraf)
            </div>
          )}
        </label>
      </div>

      {value.length > 0 && maxFiles > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}