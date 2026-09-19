import React from 'react';

export interface QuantitySelectorProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (newValue: number) => void;
    label?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    value,
    min = 1,
    max = 99,
    onChange,
    label = 'Số lượng:',
    size = 'md',
    className = '',
}) => {
    const handleDecrease = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value > min) onChange(value - 1);
    };

    const handleIncrease = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value < max) onChange(value + 1);
    };

    return (
        <>
            <style>{`
        .ab-qty-selector {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .ab-qty-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink, #071233);
        }

        .ab-qty-group {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--hairline, #dce6f7);
          border-radius: 6px;
          overflow: hidden;
          background: #ffffff;
        }

        .ab-qty-btn {
          border: none;
          background: var(--alice, #F2F7FF);
          color: var(--catalina, #0D226B);
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .ab-qty-btn:hover:not(:disabled) {
          background: #e2edff;
        }

        .ab-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ab-qty-val {
          text-align: center;
          border: none;
          font-weight: 700;
          outline: none;
          font-family: inherit;
          color: var(--ink, #071233);
          background: transparent;
        }

        /* Sizes */
        .ab-qty-selector.md .ab-qty-btn { width: 34px; height: 34px; font-size: 16px; }
        .ab-qty-selector.md .ab-qty-val { width: 42px; font-size: 13.5px; }

        .ab-qty-selector.sm .ab-qty-btn { width: 26px; height: 26px; font-size: 14px; }
        .ab-qty-selector.sm .ab-qty-val { width: 32px; font-size: 12px; }
      `}</style>

            <div className={`ab-qty-selector ${size} ${className}`}>
                {label && <span className="ab-qty-label">{label}</span>}
                <div className="ab-qty-group">
                    <button
                        type="button"
                        className="ab-qty-btn"
                        onClick={handleDecrease}
                        disabled={value <= min}
                        title="Giảm"
                    >
                        -
                    </button>
                    <input type="text" className="ab-qty-val" value={value} readOnly />
                    <button
                        type="button"
                        className="ab-qty-btn"
                        onClick={handleIncrease}
                        disabled={value >= max}
                        title="Tăng"
                    >
                        +
                    </button>
                </div>
            </div>
        </>
    );
};

export default QuantitySelector;