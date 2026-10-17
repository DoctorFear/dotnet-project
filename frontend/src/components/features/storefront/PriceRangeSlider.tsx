import React from 'react';
import styles from './PriceRangeSlider.module.css';

export interface PriceRangeSliderProps {
    minPrice: number;
    maxPrice: number;
    minLimit?: number;
    maxLimit?: number;
    step?: number;
    onChange: (min: number, max: number) => void;
    className?: string;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
    minPrice,
    maxPrice,
    minLimit = 0,
    maxLimit = 1000000,
    step = 10000,
    onChange,
    className = '',
}) => {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(e.target.value), maxPrice - step);
        onChange(value, maxPrice);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(e.target.value), minPrice + step);
        onChange(minPrice, value);
    };

    const minPercent = ((minPrice - minLimit) / (maxLimit - minLimit)) * 100;
    const maxPercent = ((maxPrice - minLimit) / (maxLimit - minLimit)) * 100;

    return (
        <>


            <div className={`${styles.priceSliderWidget} ${className}`}>
                <div className={styles.priceInputsDisplay}>
                    <div className={styles.priceBoxView}>
                        <span>Từ</span>
                        <strong>{minPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className={styles.priceBoxView}>
                        <span>Đến</span>
                        <strong>{maxPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                </div>

                <div className={styles.sliderTrackWrapper}>
                    <div
                        className={styles.customSliderTrack}
                        style={{
                            background: `linear-gradient(to right, var(--hairline) ${minPercent}%, var(--egyptian) ${minPercent}%, var(--egyptian) ${maxPercent}%, var(--hairline) ${maxPercent}%)`,
                        }}
                    />
                    <input
                        type="range"
                        aria-label="Giá tối thiểu"
                        className={styles.rangeSliderInput}
                        min={minLimit}
                        max={maxLimit}
                        step={step}
                        value={minPrice}
                        onChange={handleMinChange}
                    />
                    <input
                        type="range"
                        aria-label="Giá tối đa"
                        className={styles.rangeSliderInput}
                        min={minLimit}
                        max={maxLimit}
                        step={step}
                        value={maxPrice}
                        onChange={handleMaxChange}
                    />
                </div>
            </div>
        </>
    );
};

export default PriceRangeSlider;