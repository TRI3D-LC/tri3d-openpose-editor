import React, { ChangeEvent } from 'react';
import { imageStyle, defaultImageSrc } from './imageButtonStyles';

interface ImageUploadProps {
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  imageSrc: string;
  alt: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({label, name, onChange, imageSrc, alt}) => {
  return (
    <div>
      <label>{label}</label>
      <input name={name} type="file" accept=".jpg,.jpeg,.webp,.png,.avif" onChange={onChange} />
      <img 
        src={imageSrc || defaultImageSrc} 
        alt={alt} 
        style={{...imageStyle, width: 500, height: 500, objectFit: 'contain'}}
      />
    </div>
  )
}

export default ImageUpload;
