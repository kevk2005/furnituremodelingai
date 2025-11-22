import React, { useRef } from 'react';

interface Props {
  onImage: (dataUrl: string) => void;
}

export const ImageUpload: React.FC<Props> = ({ onImage }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p style={{ margin: '4px 0 8px' }}>Room Image</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};
