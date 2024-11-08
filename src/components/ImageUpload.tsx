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
    onImageChange(file);
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="coverImage" className="text-right">
        Cover Image
      </Label>
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