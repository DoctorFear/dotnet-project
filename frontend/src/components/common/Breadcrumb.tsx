import React from 'react';

export interface BreadcrumbItem {
    label: string;
    link?: string;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
    return (
        <>
            <style>{`
        .ab-breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted, #5b6e99);
          font-size: 12.5px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .ab-crumb-link {
          color: var(--catalina, #0D226B);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .ab-crumb-link:hover {
          color: var(--egyptian, #0B409C);
          text-decoration: underline;
        }

        .ab-crumb-text {
          color: var(--muted, #5b6e99);
        }

        .ab-crumb-active {
          color: var(--ink, #071233);
          font-weight: 600;
        }

        .ab-crumb-separator {
          color: var(--muted, #5b6e99);
          opacity: 0.6;
          user-select: none;
        }
      `}</style>

            <nav className={`ab-breadcrumb-nav ${className}`} aria-label="breadcrumb">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <React.Fragment key={index}>
                            {item.link && !isLast ? (
                                <a href={item.link} className="ab-crumb-link">
                                    {item.label}
                                </a>
                            ) : (
                                <span className={isLast ? 'ab-crumb-active' : 'ab-crumb-text'}>
                                    {item.label}
                                </span>
                            )}
                            {!isLast && <span className="ab-crumb-separator">/</span>}
                        </React.Fragment>
                    );
                })}
            </nav>
        </>
    );
};

export default Breadcrumb;