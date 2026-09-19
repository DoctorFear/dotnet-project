import React from 'react';
import { Star } from 'lucide-react'; // Import Icon Star từ Lucide

export interface StarRatingProps {
    rating: number;
    reviewsCount?: number;
    showText?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    reviewsCount,
    showText = true,
    size = 'md',
    className = '',
}) => {
    const roundedRating = Math.round(rating * 10) / 10;

    // Xác định kích thước icon Lucide dựa theo prop size
    const iconSize = size === 'sm' ? 14 : 16;

    return (
        <>
            <style>{`
        .ab-star-rating {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: var(--ink, #071233);
        }

        .ab-star-rating.sm { font-size: 11.5px; }
        .ab-star-rating.md { font-size: 13px; }

        .ab-star-icon-wrap {
          display: inline-flex;
          align-items: center;
          color: var(--saffron, #FDBE34);
          line-height: 1;
        }

        .ab-rating-num {
          font-weight: 700;
        }

        .ab-rating-count {
          color: var(--muted, #5b6e99);
          font-weight: 400;
        }
      `}</style>

            <div className={`ab-star-rating ${size} ${className}`}>
                <span className="ab-star-icon-wrap">
                    <Star size={iconSize} fill="currentColor" strokeWidth={1} />
                </span>

                {showText && (
                    <span className="ab-rating-num">
                        {roundedRating}{' '}
                        {reviewsCount !== undefined && (
                            <span className="ab-rating-count">({reviewsCount} đánh giá)</span>
                        )}
                    </span>
                )}
            </div>
        </>
    );
};

export default StarRating;