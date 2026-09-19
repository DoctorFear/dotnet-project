import React from 'react';

export interface TopBarProps {
    hotline?: string;
    freeShippingAmount?: string;
    className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
    hotline = '1900 636 467',
    freeShippingAmount = '250.000 đ',
    className = '',
}) => {
    return (
        <>
            <style>{`
        .ab-top-bar {
          background: var(--ink, #071233);
          color: var(--alice, #F2F7FF);
          padding: 8px 48px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          letter-spacing: 0.2px;
          width: 100%;
        }

        .ab-top-bar strong {
          color: var(--saffron, #FDBE34);
          font-weight: 600;
        }

        .ab-top-links {
          display: flex;
          gap: 20px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        @media (max-width: 640px) {
          .ab-top-bar {
            padding: 8px 16px;
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }
        }
      `}</style>

            <div className={`ab-top-bar ${className}`}>
                <div>
                    Miễn phí giao hàng toàn quốc cho đơn từ <strong>{freeShippingAmount}</strong> • Cam kết 100% sách chính hãng
                </div>
                <ul className="ab-top-links">
                    <li>
                        Hotline hỗ trợ: <strong>{hotline}</strong>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default TopBar;