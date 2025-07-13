import React from 'react';
import styles from './GenerationDialog.module.css';

const GenerationDialog: React.FC = () => {
  return (
    <div className={styles.dialog}>
      <h1 className={styles.title}>Generate your photos</h1>
      <p className={styles.subtitle}>Get stunning, professional-quality photos of yourself in any style.</p>
      <div className={styles.inputContainer}>
        <input type="text" placeholder="A photo of me..." className={styles.input} />
        <button className={styles.button}>Generate</button>
      </div>
    </div>
  );
};

export default GenerationDialog;
