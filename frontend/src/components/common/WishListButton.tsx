import React from 'react';
import styles from './WishListButton.module.css';
import { Heart } from 'lucide-react';

export interface WishListButtonProps {
    isWishlisted?: boolean;
    onToggle?: () => void;
    className?: string;
}

export const WishListButton: React.FC<WishListButtonProps> = ({
    isWishlisted = false,
    onToggle,
    className = '',
}) => {
    return (
        <>
            <button
                type="button"
                aria-pressed={isWishlisted}
                className={`${styles.wishlistBtnHeart} ${isWishlisted ? styles.active : ''} ${className}`}
                title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle?.();
                }}
            >
                <Heart/>
            </button>
        </>
    );
};

export default WishListButton;