import { CheckCircle2, Coins, Info, RotateCcw } from 'lucide-react';
import styles from './CheckoutPointsPanel.module.css';

interface CheckoutPointsPanelProps {
    enabled: boolean;
    input: string;
    appliedPoints: number;
    availablePoints: number;
    pendingPoints: number;
    maxPoints: number;
    loading: boolean;
    loadError: string;
    validationError: string;
    message: string;
    disabled?: boolean;
    onToggle: (enabled: boolean) => void;
    onInputChange: (value: string) => void;
    onApply: () => void;
    onSelectSuggested: (value: number) => void;
    onSelectMaximum: () => void;
    onClear: () => void;
}

const POINT_VALUE = 100;

export default function CheckoutPointsPanel({
    enabled,
    input,
    appliedPoints,
    availablePoints,
    pendingPoints,
    maxPoints,
    loading,
    loadError,
    validationError,
    message,
    disabled = false,
    onToggle,
    onInputChange,
    onApply,
    onSelectSuggested,
    onSelectMaximum,
    onClear,
}: CheckoutPointsPanelProps) {
    const unavailable = loading || Boolean(loadError) || maxPoints <= 0;
    const quickPoints = [100, 200, 500].filter((value) => value < maxPoints);

    return (
        <section className={styles.panel} aria-labelledby="fpoint-checkout-title">
            <label className={`${styles.toggle} ${unavailable ? styles.unavailable : ''}`}>
                <input
                    type="checkbox"
                    checked={enabled}
                    disabled={disabled || unavailable}
                    onChange={(event) => onToggle(event.target.checked)}
                />
                <span className={styles.toggleIcon}><Coins size={18} /></span>
                <span>
                    <strong id="fpoint-checkout-title">Sử dụng điểm tích lũy F-Point</strong>
                    <small>Giảm trực tiếp tiền sách trong đơn hàng này</small>
                </span>
            </label>

            {loading ? (
                <p className={styles.info}><Info size={14} /> Đang tải số dư F-Point...</p>
            ) : loadError ? (
                <p className={`${styles.info} ${styles.error}`} role="alert">{loadError}</p>
            ) : unavailable ? (
                <p className={styles.info}>
                    <Info size={14} /> Tài khoản của bạn chưa có điểm khả dụng hoặc đơn hàng chưa đủ điều kiện tiêu điểm!
                </p>
            ) : (
                <div className={styles.balanceRow}>
                    <span>Khả dụng: <strong>{availablePoints.toLocaleString('vi-VN')} điểm</strong></span>
                    <span>Đang chờ: <strong>{pendingPoints.toLocaleString('vi-VN')} điểm</strong></span>
                    <span>Được dùng tối đa: <strong>{maxPoints.toLocaleString('vi-VN')} điểm</strong></span>
                </div>
            )}

            {enabled && !unavailable && (
                <div className={styles.body}>
                    <div className={styles.rateNotice}>
                        <Info size={15} />
                        <span><strong>1 F-Point = {POINT_VALUE.toLocaleString('vi-VN')} đ</strong> · Tối đa 1.000 điểm/đơn và không vượt tiền sách.</span>
                    </div>

                    <div className={styles.quickActions} aria-label="Chọn nhanh số F-Point">
                        {quickPoints.map((value) => (
                            <button
                                type="button"
                                key={value}
                                disabled={disabled}
                                onClick={() => onSelectSuggested(value)}
                            >
                                {value.toLocaleString('vi-VN')} điểm · {(value * POINT_VALUE).toLocaleString('vi-VN')} đ
                            </button>
                        ))}
                        <button type="button" disabled={disabled} onClick={onSelectMaximum}>
                            Chọn tối đa
                        </button>
                    </div>

                    <div className={styles.applyRow}>
                        <label>
                            <span>Số F-Point muốn dùng</span>
                            <div className={validationError ? styles.invalidInput : ''}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={input}
                                    aria-invalid={Boolean(validationError)}
                                    aria-describedby="fpoint-validation-message"
                                    placeholder={`Nhập từ 1 đến ${maxPoints.toLocaleString('vi-VN')}`}
                                    disabled={disabled}
                                    onChange={(event) => onInputChange(event.target.value)}
                                />
                                <span>điểm</span>
                            </div>
                        </label>
                        <button type="button" className={styles.applyButton} disabled={disabled} onClick={onApply}>
                            Áp dụng
                        </button>
                    </div>

                    {validationError && (
                        <p id="fpoint-validation-message" className={styles.error} role="alert">
                            {validationError}
                        </p>
                    )}
                    {!validationError && message && (
                        <p className={appliedPoints > 0 ? styles.success : styles.info} role="status">
                            {appliedPoints > 0 && <CheckCircle2 size={14} />}{message}
                        </p>
                    )}

                    {appliedPoints > 0 && (
                        <div className={styles.appliedSummary}>
                            <span>
                                Đang áp dụng <strong>{appliedPoints.toLocaleString('vi-VN')} điểm</strong>
                                {' '}(-{(appliedPoints * POINT_VALUE).toLocaleString('vi-VN')} đ)
                            </span>
                            <button type="button" disabled={disabled} onClick={onClear}>
                                <RotateCcw size={13} /> Bỏ áp dụng
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
