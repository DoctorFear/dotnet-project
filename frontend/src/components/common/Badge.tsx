import React from 'react';

export interface BadgeProps {
    count?: number;
    variant?: 'count' | 'voucher' | 'stock_ok' | 'stock_warning' | 'ebook' | 'rental';
    text?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    count,
    variant = 'count',
    text,
    className = '',
}) => {
    return (
        <>
            <style>{`
        .ab-badge-count {
          background: var(--egyptian, #0B409C);
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .ab-badge-voucher {
          background: #fef3c7;
          color: #92400e;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-left: 2px;
        }

        .ab-badge-stock-warning {
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
          background: #fffbeb;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .ab-badge-stock-ok {
          font-size: 11px;
          font-weight: 700;
          color: var(--success, #15803d);
          background: var(--success-bg, #ecfdf5);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .ab-badge-ebook {
          font-size: 10px;
          font-weight: 700;
          color: #1e40af;
          background: #dbeafe;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .ab-badge-rental {
          font-size: 10px;
          font-weight: 700;
          color: #6b21a8;
          background: #f3e8ff;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }
      `}</style>

            {variant === 'count' && (
                <span className={`ab-badge-count ${className}`}>{count ?? 0}</span>
            )}
            {variant === 'voucher' && (
                <span className={`ab-badge-voucher ${className}`}>{text || 'Hot'}</span>
            )}
            {variant === 'stock_warning' && (
                <span className={`ab-badge-stock-warning ${className}`}>
                    {text || 'Chỉ còn ít cuốn'}
                </span>
            )}
            {variant === 'stock_ok' && (
                <span className={`ab-badge-stock-ok ${className}`}>{text || 'Còn hàng'}</span>
            )}
            {variant === 'ebook' && (
                <span className={`ab-badge-ebook ${className}`}>{text || 'E-Book'}</span>
            )}
            {variant === 'rental' && (
                <span className={`ab-badge-rental ${className}`}>{text || 'Cho thuê'}</span>
            )}
        </>
    );
};

export default Badge;