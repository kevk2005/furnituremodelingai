import React, { useRef } from 'react';
import heic2any from 'heic2any';

interface Props {
  onImage: (dataUrl: string) => void;
}

export const ImageUpload: React.FC<Props> = ({ onImage }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let processedFile = file;

      // Convert HEIC/HEIF to JPEG if needed
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('[ImageUpload] Converting HEIC to JPEG...');
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });
        // heic2any can return Blob or Blob[], handle both cases
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        console.log('[ImageUpload] HEIC conversion successful');
      }

      // Read the file as data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImage(reader.result);
        }
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('[ImageUpload] Error processing image:', error);
      alert('Failed to process image. Please try a different file format.');
    }
  }

  return (
    <div>
      <p style={{ margin: '4px 0 8px' }}>Room Image</p>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" onChange={handleFileChange} />
    </div>
  );
};
