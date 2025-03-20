import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
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

  const handleFiles = async (files: File[]) => {
    // For server-uploaded images, we would typically use FormData
    // For now, let's convert these to base64 strings which can be saved in the database
    const urlPromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // reader.result contains the base64 data URL
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });
    
    const base64Urls = await Promise.all(urlPromises);
    onChange([...value, ...base64Urls]);
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
          accept="image/*"
          multiple
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
            Fotoğrafları buraya sürükleyin veya seçmek için tıklayın
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            (Maksimum {maxFiles} fotoğraf)
          </div>
        </label>
      </div>

      {value.length > 0 && (
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
