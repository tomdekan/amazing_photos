import React from 'react';
import styles from './PhotoColumn.module.css';

interface PhotoColumnProps {
  images: string[];
}

const PhotoColumn: React.FC<PhotoColumnProps> = ({ images }) => {
  return (
    <div className={styles.photoColumn}>
      <div className={styles.scrolling}>
        {images.map((src, index) => (
          <img key={index} src={src} alt={`placeholder ${index + 1}`} className={styles.photo} />
        ))}
        {images.map((src, index) => (
          <img key={index + images.length} src={src} alt={`placeholder ${index + 1}`} className={styles.photo} />
        ))}
      </div>
    </div>
  );
};

export default PhotoColumn;
