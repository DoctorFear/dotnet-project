import React, { useState } from 'react';
import { RotateCcw, Save, AlertTriangle, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import styles from './AdminSettingsManagement.module.css';

// Giá trị mặc định chuẩn hệ thống
const defaultSettings = {
    lowStockThreshold: 5,
    pointRateBronze: 5,
    pointRateSilver: 10,
    pointRateGold: 15,
    maxPointsPerOrder: 20000,
    maxReturnDays: 7,
};

// Khởi tạo tùy chọn phần trăm tích điểm 0% - 100%
const percentOptions = Array.from({ length: 21 }, (_, index) => index * 5);

export const AdminSettingsManagement: React.FC = () => {
    // Trạng thái các tham số cài đặt
    const [lowStockThreshold, setLowStockThreshold] = useState(defaultSettings.lowStockThreshold);
    const [bronzeRate, setBronzeRate] = useState(defaultSettings.pointRateBronze);
    const [silverRate, setSilverRate] = useState(defaultSettings.pointRateSilver);
    const [goldRate, setGoldRate] = useState(defaultSettings.pointRateGold);
    const [maxPoints, setMaxPoints] = useState(defaultSettings.maxPointsPerOrder);
    const [maxReturnDays, setMaxReturnDays] = useState(defaultSettings.maxReturnDays);

    // Trạng thái thông báo Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Hiển thị thông báo Toast
    const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    };

    // Khôi phục giá trị mặc định
    const handleRestoreDefault = () => {
        setLowStockThreshold(defaultSettings.lowStockThreshold);
        setBronzeRate(defaultSettings.pointRateBronze);
        setSilverRate(defaultSettings.pointRateSilver);
        setGoldRate(defaultSettings.pointRateGold);
        setMaxPoints(defaultSettings.maxPointsPerOrder);
        setMaxReturnDays(defaultSettings.maxReturnDays);
        showToastNotification('Đã khôi phục cài đặt về giá trị mặc định.', 'success');
    };

    // Lưu cài đặt hệ thống
    const handleSaveSettings = () => {
        // Kiểm tra ràng buộc hợp lệ dữ liệu
        if (
            lowStockThreshold < 0 ||
            bronzeRate < 0 || bronzeRate > 100 ||
            silverRate < 0 || silverRate > 100 ||
            goldRate < 0 || goldRate > 100 ||
            maxPoints < 0 ||
            maxReturnDays < 1
        ) {
            showToastNotification('Giá trị cài đặt không hợp lệ. Vui lòng kiểm tra lại!', 'error');
            return;
        }

        showToastNotification('Cập nhật cài đặt hệ thống thành công.', 'success');
    };

    return (
        <div className={styles.settingsContainer}>
            {/* 1. Cấu hình Cảnh báo Kho & Vận chuyển (Huy & Sơn) */}
            <section className={styles.settingsCard}>
                <div className={styles.cardHeader}>
                    <AlertTriangle className={styles.headerIcon} size={18} />
                    <h2>Cảnh báo kho hàng & Quy định đổi trả</h2>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="lowStockThreshold">
                                Ngưỡng cảnh báo sách sắp hết
                            </label>
                            <span className={styles.settingDesc}>
                                Số lượng tồn kho tối thiểu để hệ thống đưa ra cảnh báo cho nhân viên kho.
                            </span>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="lowStockThreshold"
                                    type="number"
                                    className={styles.inputControl}
                                    value={lowStockThreshold}
                                    min={0}
                                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                                />
                                <span className={styles.unitText}>Cuốn</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="maxReturnDays">
                                Thời hạn tối đa yêu cầu hoàn hàng
                            </label>
                            <span className={styles.settingDesc}>
                                Số ngày tối đa khách hàng được gửi yêu cầu hoàn trả kể từ khi giao thành công.
                            </span>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="maxReturnDays"
                                    type="number"
                                    className={styles.inputControl}
                                    value={maxReturnDays}
                                    min={1}
                                    onChange={(e) => setMaxReturnDays(Number(e.target.value))}
                                />
                                <span className={styles.unitText}>Ngày</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Cấu hình Tích điểm & Hạn mức F-Point (MPhương) */}
            <section className={styles.settingsCard}>
                <div className={styles.cardHeader}>
                    <Award className={styles.headerIcon} size={18} />
                    <h2>Chính sách tích điểm & Hạn mức F-Point</h2>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="bronzeRate">
                                Tỉ lệ tích điểm - Hạng Đồng
                            </label>
                            <span className={styles.settingDesc}>
                                Tỉ lệ phần trăm tích điểm cho thành viên Hạng Đồng.
                            </span>
                            <div className={styles.inputWrapper}>
                                <select
                                    id="bronzeRate"
                                    className={styles.selectControl}
                                    value={bronzeRate}
                                    onChange={(e) => setBronzeRate(Number(e.target.value))}
                                >
                                    {percentOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="silverRate">
                                Tỉ lệ tích điểm - Hạng Bạc
                            </label>
                            <span className={styles.settingDesc}>
                                Tỉ lệ phần trăm tích điểm cho thành viên Hạng Bạc.
                            </span>
                            <div className={styles.inputWrapper}>
                                <select
                                    id="silverRate"
                                    className={styles.selectControl}
                                    value={silverRate}
                                    onChange={(e) => setSilverRate(Number(e.target.value))}
                                >
                                    {percentOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="goldRate">
                                Tỉ lệ tích điểm - Hạng Vàng
                            </label>
                            <span className={styles.settingDesc}>
                                Tỉ lệ phần trăm tích điểm cho thành viên Hạng Vàng.
                            </span>
                            <div className={styles.inputWrapper}>
                                <select
                                    id="goldRate"
                                    className={styles.selectControl}
                                    value={goldRate}
                                    onChange={(e) => setGoldRate(Number(e.target.value))}
                                >
                                    {percentOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel} htmlFor="maxPoints">
                                Mức điểm sử dụng tối đa
                            </label>
                            <span className={styles.settingDesc}>
                                Số F-Point tối đa được quy đổi trừ tiền trên một đơn hàng.
                            </span>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="maxPoints"
                                    type="number"
                                    className={styles.inputControl}
                                    value={maxPoints}
                                    min={0}
                                    onChange={(e) => setMaxPoints(Number(e.target.value))}
                                />
                                <span className={styles.unitText}>F-Point</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={styles.cardFooter}>
                    <button type="button" className={styles.btnSecondary} onClick={handleRestoreDefault}>
                        <RotateCcw size={16} /> Khôi phục mặc định
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={handleSaveSettings}>
                        <Save size={16} /> Lưu thay đổi
                    </button>
                </div>
            </section>

            {/* Cấu trúc Toast Notification thống nhất */}
            {toast && (
                <div
                    className={`${styles.toastNotification} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={18} color="#22c55e" />
                    ) : (
                        <AlertCircle size={18} color="#d93838" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default AdminSettingsManagement;