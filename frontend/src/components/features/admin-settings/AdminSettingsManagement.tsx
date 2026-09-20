import React, { useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import type { SystemSettingData } from '../../../types/systemSetting';
import styles from './AdminSettingsManagement.module.css';

const defaultRates = {
    bronze: 5,
    silver: 10,
    gold: 15,
    maxPoints: 50000,
};

const percentOptions = Array.from({ length: 21 }, (_, index) => index * 5);

export const AdminSettingsManagement: React.FC = () => {
    const [bronzeRate, setBronzeRate] = useState(defaultRates.bronze);
    const [silverRate, setSilverRate] = useState(defaultRates.silver);
    const [goldRate, setGoldRate] = useState(defaultRates.gold);
    const [maxPoints, setMaxPoints] = useState(defaultRates.maxPoints);
    const [toast, setToast] = useState('');

    const settingsRows: SystemSettingData[] = useMemo(() => [
        {
            settingKey: 'POINT_RATE_BRONZE',
            settingValue: String(bronzeRate),
            dataType: 'INT',
            description: 'Tỉ lệ tích điểm cho Hạng Đồng',
            updatedAt: '2026-09-20 08:30:00',
            updatedBy: '1',
        },
        {
            settingKey: 'POINT_RATE_SILVER',
            settingValue: String(silverRate),
            dataType: 'INT',
            description: 'Tỉ lệ tích điểm cho Hạng Bạc',
            updatedAt: '2026-09-20 08:30:00',
            updatedBy: '1',
        },
        {
            settingKey: 'POINT_RATE_GOLD',
            settingValue: String(goldRate),
            dataType: 'INT',
            description: 'Tỉ lệ tích điểm cho Hạng Vàng',
            updatedAt: '2026-09-20 08:30:00',
            updatedBy: '1',
        },
        {
            settingKey: 'MAX_POINT_USAGE_PER_ORDER',
            settingValue: String(maxPoints),
            dataType: 'INT',
            description: 'Mức điểm sử dụng tối đa cho 1 đơn hàng',
            updatedAt: '2026-09-20 08:30:00',
            updatedBy: '1',
        },
    ], [bronzeRate, goldRate, maxPoints, silverRate]);

    const showToast = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 2600);
    };

    const restoreDefault = () => {
        setBronzeRate(defaultRates.bronze);
        setSilverRate(defaultRates.silver);
        setGoldRate(defaultRates.gold);
        setMaxPoints(defaultRates.maxPoints);
        showToast('Đã khôi phục cấu hình mặc định.');
    };

    const saveSettings = () => {
        if (bronzeRate < 0 || bronzeRate > 100 || silverRate < 0 || silverRate > 100 || goldRate < 0 || goldRate > 100 || maxPoints < 0) {
            showToast('Giá trị cài đặt không hợp lệ.');
            return;
        }

        showToast('Cập nhật cài đặt hệ thống thành công.');
    };

    const renderPercentSelect = (value: number, onChange: (value: number) => void, id: string) => (
        <select id={id} className={styles.selectControl} value={value} onChange={(event) => onChange(Number(event.target.value))}>
            {percentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    );

    return (
        <>
            <div className={styles.settingsGrid}>
                <section className={styles.settingsPanel}>
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitle}>
                            <h2>Cấu hình tích điểm F-Point</h2>
                            <span>Áp dụng cho Hạng Đồng, Hạng Bạc, Hạng Vàng và hạn mức dùng điểm trên đơn hàng.</span>
                        </div>
                    </div>

                    <div className={styles.formBody}>
                        <div className={styles.settingGroup}>
                            <div className={styles.settingLabel}>
                                <strong>Hạng Đồng</strong>
                                <span>Tỉ lệ phần trăm tích điểm cho đơn hàng hoàn thành.</span>
                            </div>
                            <div className={styles.settingControl}>
                                {renderPercentSelect(bronzeRate, setBronzeRate, 'bronzeRate')}
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <div className={styles.settingLabel}>
                                <strong>Hạng Bạc</strong>
                                <span>Tỉ lệ phần trăm tích điểm cho khách hàng hạng Bạc.</span>
                            </div>
                            <div className={styles.settingControl}>
                                {renderPercentSelect(silverRate, setSilverRate, 'silverRate')}
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <div className={styles.settingLabel}>
                                <strong>Hạng Vàng</strong>
                                <span>Tỉ lệ phần trăm tích điểm cho khách hàng hạng Vàng.</span>
                            </div>
                            <div className={styles.settingControl}>
                                {renderPercentSelect(goldRate, setGoldRate, 'goldRate')}
                                <span className={styles.unitText}>%</span>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <div className={styles.settingLabel}>
                                <strong>Mức điểm dùng tối đa</strong>
                                <span>Số F-Point tối đa được quy đổi trừ tiền trên một đơn hàng.</span>
                            </div>
                            <div className={styles.settingControl}>
                                <input
                                    type="number"
                                    className={styles.inputControl}
                                    value={maxPoints}
                                    min={0}
                                    onChange={(event) => setMaxPoints(Number(event.target.value))}
                                />
                                <span className={styles.unitText}>F-Point</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.panelFooter}>
                        <button type="button" className={styles.btnSecondary} onClick={restoreDefault}>
                            <RotateCcw /> Khôi phục mặc định
                        </button>
                        <button type="button" className={styles.btnPrimary} onClick={saveSettings}>
                            <Save /> Lưu thay đổi
                        </button>
                    </div>
                </section>

                <aside className={styles.warningBox}>
                    Mọi thao tác cập nhật cài đặt cần được ghi vào Audit Log khi kết nối backend. Các giá trị tỉ lệ phần trăm chỉ hợp lệ trong khoảng 0% đến 100%, mức điểm tối đa không được âm.
                </aside>
            </div>

            <section className={styles.settingsPanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>
                        <h2>Bảng SystemSettings</h2>
                        <span>Dạng Key-Value theo UC cài đặt hệ thống.</span>
                    </div>
                </div>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>SettingKey</th>
                            <th>SettingValue</th>
                            <th>DataType</th>
                            <th>Description</th>
                            <th>UpdatedAt</th>
                            <th>UpdatedBy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {settingsRows.map((setting) => (
                            <tr key={setting.settingKey}>
                                <td className={styles.settingKey}>{setting.settingKey}</td>
                                <td>{setting.settingValue}</td>
                                <td>{setting.dataType}</td>
                                <td>{setting.description}</td>
                                <td>{setting.updatedAt}</td>
                                <td>{setting.updatedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
};

export default AdminSettingsManagement;
