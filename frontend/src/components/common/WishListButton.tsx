import React from 'react';
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
            <style>{`
        .ab-wishlist-btn-heart {
          background: #ffffff;
          border: 1px solid var(--hairline, #dce6f7);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(7, 18, 51, 0.08);
          color: var(--muted, #5b6e99);
        }

        .ab-wishlist-btn-heart:hover {
          transform: scale(1.1);
          border-color: var(--danger, #d93838);
          color: var(--danger, #d93838);
        }

        .ab-wishlist-btn-heart.active {
          background: #fff0f0;
          border-color: var(--danger, #d93838);
          color: var(--danger, #d93838);
        }

        .ab-wishlist-btn-heart svg {
          width: 17px;
          height: 17px;
        }
      `}</style>

            <button
                type="button"
                className={`ab-wishlist-btn-heart ${isWishlisted ? 'active' : ''} ${className}`}
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