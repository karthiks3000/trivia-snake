import React, { useRef } from 'react';
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024) { // 4KB in bytes
        alert('File size must be less than 4KB');
        e.target.value = '';
        return;
      }
      onImageChange(file);
    } else {
      onImageChange(null);
    }
  };

  return (
    <div>

      <Label htmlFor="coverImage" className="text-right">
        Cover Image
      </Label>
      <p className="text-sm text-muted-foreground col-span-2">Max file size: 4KB</p>
      <Input
        id="coverImage"
        type="file"
        onChange={handleFileChange}
        className="col-span-3"
        accept="image/*"
        ref={fileInputRef}
      />
    </div>
  );
};

export default ImageUpload;