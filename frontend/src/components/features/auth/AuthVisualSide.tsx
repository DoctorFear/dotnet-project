import React from 'react';
import styles from './AuthVisualSide.module.css';

interface AuthVisualSideProps {
    kicker: string;
    quote: string;
    author: string;
}

export const AuthVisualSide: React.FC<AuthVisualSideProps> = ({ kicker, quote, author }) => {
    return (
        <div className={styles.visualColumn}>
            <div className={styles.visualInner}>
                <span className={styles.panelKicker}>{kicker}</span>
                <p className={styles.quoteText}>{quote}</p>
                <p className={styles.quoteAuthor}>{author}</p>
            </div>
        </div>
    );
};

export default AuthVisualSide;
