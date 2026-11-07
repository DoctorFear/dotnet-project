import { useEffect, useState } from 'react';

export function useWorkflowResource<T>(load: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    useEffect(() => {
        let active = true;
        void Promise.resolve().then(() => {
            if (active) {
                setLoading(true);
                setError('');
            }
        });
        load()
            .then((value) => {
                if (active) setData(value);
            })
            .catch((reason) => {
                if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [load, version]);
    return { data, loading, error, reload: () => setVersion((value) => value + 1) };
}
