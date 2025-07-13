import PhotoColumn from '../components/PhotoColumn';
import GenerationDialog from '../components/GenerationDialog';
import styles from './page.module.css';

export default function LandingPage() {
  const images = [
    '/placeholder1.svg',
    '/placeholder2.svg',
    '/placeholder3.svg',
  ];

  return (
    <div className={styles.container}>
      <PhotoColumn images={images} />
      <main className={styles.main}>
        <GenerationDialog />
      </main>
      <PhotoColumn images={images} />
    </div>
  );
}