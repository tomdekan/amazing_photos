import React from 'react';
import Image from 'next/image';
import styles from './PhotoColumn.module.css';

interface PhotoColumnProps {
  images: string[];
}

const PhotoColumn: React.FC<PhotoColumnProps> = ({ images }) => {
  const allImages = [...images, ...images];

  return (
    <div className={styles.photoColumn}>
      <div className={styles.scrolling}>
        {allImages.map((src, index) => (
          <div key={`${src}-${index}`} className={styles.photoWrapper}>
            <Image
              src={src}
              alt={`placeholder ${index + 1}`}
              fill
              sizes="200px"
              className={styles.photo}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoColumn;
