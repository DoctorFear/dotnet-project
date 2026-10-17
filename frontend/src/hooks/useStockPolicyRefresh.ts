import { useEffect, useState } from 'react';

export const useStockPolicyRefresh = () => {
    const [version, setVersion] = useState(0);
    useEffect(() => {
        const refresh = () => setVersion(current => current + 1);
        const onStorage = (event: StorageEvent) => { if (event.key === 'catalog-stock-policy-version') refresh(); };
        window.addEventListener('catalog-stock-policy-changed', refresh);
        window.addEventListener('storage', onStorage);
        return () => { window.removeEventListener('catalog-stock-policy-changed', refresh); window.removeEventListener('storage', onStorage); };
    }, []);
    return version;
};
