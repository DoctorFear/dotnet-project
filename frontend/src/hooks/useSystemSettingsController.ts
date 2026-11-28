import { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getSystemSettings, restoreSystemSettings, saveSystemSettings } from '../services/systemSettingsService';
import type { SystemSettings } from '../types/systemSettings';
import { useToastNotifications } from './useToastNotifications';

// Quản lý tải, kiểm tra ràng buộc và lưu cấu hình hệ thống (Admin sửa, Staff chỉ đọc).
export const useSystemSettingsController = () => {
    const { user } = useUser();
    const isReadOnly = user?.role !== 'Admin';
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [error, setError] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const busy = useRef(false);
    const notifications = useToastNotifications();

    useEffect(() => {
        let active = true;
        getSystemSettings()
            .then((result) => {
                if (active) setSettings(result);
            })
            .catch((reason) => {
                if (active) setError(reason.message);
            });
        return () => {
            active = false;
        };
    }, []);

    const change = (key: keyof SystemSettings, value: number) => {
        if (isReadOnly) return;
        setSettings((current) => (current ? { ...current, [key]: value } : current));
    };

    const validateSettings = (target: SystemSettings): string | null => {
        if (Object.values(target).some((value) => !Number.isFinite(value) || value < 0)) {
            return 'Các giá trị cài đặt phải là số hợp lệ và không được âm.';
        }

        const integerFields = [
            target.lowStockThreshold,
            target.maxPointsPerOrder,
            target.maxReturnDays,
            target.pointRateBronze,
            target.pointRateSilver,
            target.pointRateGold,
        ];
        if (integerFields.some((value) => !Number.isInteger(value))) {
            return 'Các tham số số lượng, số ngày và tỉ lệ tích điểm phải là số nguyên.';
        }

        if (target.lowStockThreshold < 1 || target.lowStockThreshold > 100) {
            return 'Ngưỡng cảnh báo sách sắp hết phải là số nguyên từ 1 đến 100.';
        }

        if (target.maxReturnDays < 1) {
            return 'Thời hạn tối đa yêu cầu hoàn hàng phải lớn hơn hoặc bằng 1 ngày.';
        }

        if (target.maxPointsPerOrder < 0 || target.maxPointsPerOrder > 1000) {
            return 'Mức điểm sử dụng tối đa phải nằm trong khoảng từ 0 đến 1.000 F-Point.';
        }

        if (Math.max(target.pointRateBronze, target.pointRateSilver, target.pointRateGold) > 100) {
            return 'Tỉ lệ tích điểm phải nằm trong khoảng từ 0% đến 100%.';
        }

        if (target.pointRateSilver < target.pointRateBronze || target.pointRateGold < target.pointRateSilver) {
            return 'Tỉ lệ tích điểm phải đảm bảo Hạng Vàng >= Hạng Bạc >= Hạng Đồng.';
        }

        if (
            target.memberUpgradeSpendingSilver < target.memberUpgradeSpendingBronze ||
            target.memberUpgradeSpendingGold < target.memberUpgradeSpendingSilver
        ) {
            return 'Ngưỡng chi tiêu thăng hạng phải tăng dần (Vàng >= Bạc >= Đồng).';
        }

        return null;
    };

    const persist = async (restore: boolean) => {
        if (isReadOnly || !settings || busy.current) return;

        if (!restore) {
            const validationError = validateSettings(settings);
            if (validationError) {
                notifications.notify(validationError, 'error');
                return;
            }
        }

        busy.current = true;
        setIsBusy(true);
        try {
            if (restore) {
                await restoreSystemSettings();
            } else {
                await saveSystemSettings(settings);
            }

            const saved = await getSystemSettings();
            localStorage.setItem('catalog-stock-policy-version', String(Date.now()));
            window.dispatchEvent(new Event('catalog-stock-policy-changed'));
            setSettings(saved);
            setRestoreOpen(false);
            notifications.notify(
                restore ? 'Đã khôi phục và lưu cấu hình mặc định.' : 'Đã lưu cài đặt vào database.',
                'success'
            );
        } catch (reason) {
            notifications.notify(
                reason instanceof Error ? reason.message : 'Không thể lưu cài đặt.',
                'error'
            );
        } finally {
            busy.current = false;
            setIsBusy(false);
        }
    };

    return {
        settings,
        error,
        isBusy,
        isReadOnly,
        restoreOpen,
        setRestoreOpen,
        notifications,
        change,
        save: () => persist(false),
        restore: () => persist(true),
    };
};
