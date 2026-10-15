import React from 'react';
import { useSystemSettingsController } from '../../../hooks/useSystemSettingsController';
import ToastNotification from '../../common/ToastNotification';
import ConfirmDialog from '../../common/ConfirmDialog';
import { RotateCcw, Save, AlertTriangle, Award, TrendingUp } from 'lucide-react';
import styles from './AdminSettingsManagement.module.css';

const percentOptions = Array.from({ length: 101 }, (_, index) => index);
export const AdminSettingsManagement: React.FC = () => {
    const controller = useSystemSettingsController();
    if (controller.error) return <p role="alert">{controller.error}</p>;
    if (!controller.settings) return <p>Đang tải cài đặt...</p>;
    const { lowStockThreshold, pointRateBronze: bronzeRate, pointRateSilver: silverRate, pointRateGold: goldRate, maxPointsPerOrder: maxPoints, maxReturnDays, memberUpgradeSpendingBronze: bronzeUpgradeSpending, memberUpgradeSpendingSilver: silverUpgradeSpending, memberUpgradeSpendingGold: goldUpgradeSpending } = controller.settings;
    const notification = <ToastNotification toasts={controller.notifications.toasts} onClose={controller.notifications.dismissToast} />;
    return (
        <div className={styles.settingsContainer}>
            {/* Cảnh báo tồn kho và quy định đổi trả */}
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
                                <input disabled={controller.isBusy}
                                    id="lowStockThreshold"
                                    type="number"
                                    className={styles.inputControl}
                                    value={lowStockThreshold}
                                    min={0}
                                    onChange={(e) => controller.change('lowStockThreshold', Number(e.target.value))}
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
                                <input disabled={controller.isBusy}
                                    id="maxReturnDays"
                                    type="number"
                                    className={styles.inputControl}
                                    value={maxReturnDays}
                                    min={1}
                                    onChange={(e) => controller.change('maxReturnDays', Number(e.target.value))}
                                />
                                <span className={styles.unitText}>Ngày</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Chính sách tích điểm và hạn mức F-Point */}
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
                                <select disabled={controller.isBusy}
                                    id="bronzeRate"
                                    className={styles.selectControl}
                                    value={bronzeRate}
                                    onChange={(e) => controller.change('pointRateBronze', Number(e.target.value))}
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
                                <select disabled={controller.isBusy}
                                    id="silverRate"
                                    className={styles.selectControl}
                                    value={silverRate}
                                    onChange={(e) => controller.change('pointRateSilver', Number(e.target.value))}
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
                                <select disabled={controller.isBusy}
                                    id="goldRate"
                                    className={styles.selectControl}
                                    value={goldRate}
                                    onChange={(e) => controller.change('pointRateGold', Number(e.target.value))}
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
                                <input disabled={controller.isBusy}
                                    id="maxPoints"
                                    type="number"
                                    className={styles.inputControl}
                                    value={maxPoints}
                                    min={0}
                                    onChange={(e) => controller.change('maxPointsPerOrder', Number(e.target.value))}
                                />
                                <span className={styles.unitText}>F-Point</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tierThresholdSection}>
                        <div className={styles.tierThresholdTitle}>
                            <TrendingUp size={16} />
                            <span>Ngưỡng tổng chi tiêu thăng hạng thành viên</span>
                        </div>
                        <div className={styles.tierThresholdGrid}>
                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel} htmlFor="bronzeUpgradeSpending">
                                    Thăng hạng Đồng
                                </label>
                                <span className={styles.settingDesc}>
                                    Tổng chi tiêu tối thiểu để khách hàng đạt Hạng Đồng.
                                </span>
                                <div className={styles.inputWrapper}>
                                    <input disabled={controller.isBusy}
                                        id="bronzeUpgradeSpending"
                                        type="number"
                                        className={styles.inputControl}
                                        value={bronzeUpgradeSpending}
                                        min={0}
                                        onChange={(e) => controller.change('memberUpgradeSpendingBronze', Number(e.target.value))}
                                    />
                                    <span className={styles.unitText}>VNĐ</span>
                                </div>
                            </div>

                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel} htmlFor="silverUpgradeSpending">
                                    Thăng hạng Bạc
                                </label>
                                <span className={styles.settingDesc}>
                                    Tổng chi tiêu tối thiểu để khách hàng đạt Hạng Bạc.
                                </span>
                                <div className={styles.inputWrapper}>
                                    <input disabled={controller.isBusy}
                                        id="silverUpgradeSpending"
                                        type="number"
                                        className={styles.inputControl}
                                        value={silverUpgradeSpending}
                                        min={0}
                                        onChange={(e) => controller.change('memberUpgradeSpendingSilver', Number(e.target.value))}
                                    />
                                    <span className={styles.unitText}>VNĐ</span>
                                </div>
                            </div>

                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel} htmlFor="goldUpgradeSpending">
                                    Thăng hạng Vàng
                                </label>
                                <span className={styles.settingDesc}>
                                    Tổng chi tiêu tối thiểu để khách hàng đạt Hạng Vàng.
                                </span>
                                <div className={styles.inputWrapper}>
                                    <input disabled={controller.isBusy}
                                        id="goldUpgradeSpending"
                                        type="number"
                                        className={styles.inputControl}
                                        value={goldUpgradeSpending}
                                        min={0}
                                        onChange={(e) => controller.change('memberUpgradeSpendingGold', Number(e.target.value))}
                                    />
                                    <span className={styles.unitText}>VNĐ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={styles.cardFooter}>
                    <button type="button" className={styles.btnSecondary} disabled={controller.isBusy} onClick={() => controller.setRestoreOpen(true)}>
                        <RotateCcw size={16} /> Khôi phục mặc định
                    </button>
                    <button type="button" className={styles.btnPrimary} disabled={controller.isBusy} onClick={() => void controller.save()}>
                        <Save size={16} /> Lưu thay đổi
                    </button>
                </div>
            </section>

            {!controller.restoreOpen && notification}
            {controller.restoreOpen && <ConfirmDialog title="Khôi phục cài đặt mặc định?" message="Thao tác này thay thế các cấu hình hiện tại trong database." busy={controller.isBusy} onClose={() => controller.setRestoreOpen(false)} onConfirm={() => void controller.restore()}>{notification}</ConfirmDialog>}

        </div>
    );
};

export default AdminSettingsManagement;
