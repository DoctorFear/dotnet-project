import { useEffect, useRef, useState } from 'react';
import { getSystemSettings, restoreSystemSettings, saveSystemSettings } from '../services/systemSettingsService';
import type { SystemSettings } from '../types/systemSettings';
import { useToastNotifications } from './useToastNotifications';

export const useSystemSettingsController = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [error, setError] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const busy = useRef(false);
    const notifications = useToastNotifications();
    useEffect(() => {
        let active = true;
        getSystemSettings().then(result => { if (active) setSettings(result); })
            .catch(reason => { if (active) setError(reason.message); });
        return () => { active = false; };
    }, []);
    const change = (key: keyof SystemSettings, value: number) => setSettings(current => current ? { ...current, [key]: value } : current);
    const persist = async (restore: boolean) => {
        if (!settings || busy.current) return;
        if (!restore && (Object.values(settings).some(value => !Number.isFinite(value) || value < 0) || settings.maxReturnDays < 1 ||
            [settings.lowStockThreshold, settings.maxPointsPerOrder, settings.maxReturnDays, settings.pointRateBronze, settings.pointRateSilver, settings.pointRateGold].some(value => !Number.isInteger(value)) ||
            Math.max(settings.pointRateBronze, settings.pointRateSilver, settings.pointRateGold) > 100 ||
            settings.memberUpgradeSpendingSilver < settings.memberUpgradeSpendingBronze || settings.memberUpgradeSpendingGold < settings.memberUpgradeSpendingSilver)) {
            notifications.notify('Giá trị cài đặt không hợp lệ. Vui lòng kiểm tra lại.', 'error'); return;
        }
        busy.current = true; setIsBusy(true);
        try {
            if (restore) await restoreSystemSettings(); else await saveSystemSettings(settings);
            const saved = await getSystemSettings();
            localStorage.setItem('catalog-stock-policy-version', String(Date.now()));
            window.dispatchEvent(new Event('catalog-stock-policy-changed'));
            setSettings(saved); setRestoreOpen(false);
            notifications.notify(restore ? 'Đã khôi phục và lưu cấu hình mặc định.' : 'Đã lưu cài đặt vào database.', 'success');
        } catch (reason) { notifications.notify(reason instanceof Error ? reason.message : 'Không thể lưu cài đặt.', 'error'); }
        finally { busy.current = false; setIsBusy(false); }
    };
    return { settings, error, isBusy, restoreOpen, setRestoreOpen, notifications, change, save: () => persist(false), restore: () => persist(true) };
};
