import React from 'react';

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
            <style>{`
        .ab-price-slider-widget {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .ab-price-inputs-display {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ab-price-box-view {
          flex: 1;
          background: #fafcff;
          border: 1px solid var(--hairline, #dce6f7);
          border-radius: 4px;
          padding: 6px 8px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ab-price-box-view span {
          font-size: 10px;
          color: var(--muted, #5b6e99);
          font-weight: 500;
        }

        .ab-price-box-view strong {
          font-weight: 700;
          color: var(--catalina, #0D226B);
        }

        .ab-slider-track-wrapper {
          position: relative;
          height: 24px;
          display: flex;
          align-items: center;
          margin: 0 4px;
        }

        .ab-custom-slider-track {
          position: absolute;
          height: 6px;
          width: 100%;
          border-radius: 5px;
          pointer-events: none;
          z-index: 1;
        }

        .ab-range-slider-input {
          position: absolute;
          width: 100%;
          background: none;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          z-index: 2;
          margin: 0;
        }

        .ab-range-slider-input::-webkit-slider-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--egyptian, #0B409C);
          pointer-events: auto;
          -webkit-appearance: none;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(7, 12, 51, 0.2);
        }

        .ab-range-slider-input::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border: none;
          border-radius: 50%;
          background: var(--egyptian, #0B409C);
          pointer-events: auto;
          -moz-appearance: none;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(7, 12, 51, 0.2);
        }
      `}</style>

            <div className={`ab-price-slider-widget ${className}`}>
                <div className="ab-price-inputs-display">
                    <div className="ab-price-box-view">
                        <span>Từ</span>
                        <strong>{minPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="ab-price-box-view">
                        <span>Đến</span>
                        <strong>{maxPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                </div>

                <div className="ab-slider-track-wrapper">
                    <div
                        className="ab-custom-slider-track"
                        style={{
                            background: `linear-gradient(to right, #dce6f7 ${minPercent}%, #0B409C ${minPercent}%, #0B409C ${maxPercent}%, #dce6f7 ${maxPercent}%)`,
                        }}
                    />
                    <input
                        type="range"
                        className="ab-range-slider-input"
                        min={minLimit}
                        max={maxLimit}
                        step={step}
                        value={minPrice}
                        onChange={handleMinChange}
                    />
                    <input
                        type="range"
                        className="ab-range-slider-input"
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