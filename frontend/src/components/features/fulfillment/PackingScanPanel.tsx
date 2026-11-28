import { useMemo, useState } from 'react';
import { Barcode, Check, MapPin, RotateCcw, ScanLine } from 'lucide-react';
import type { PackingItemDetail } from '../../../types/workflow';
import styles from './PackingScanPanel.module.css';

interface PackingScanPanelProps {
    item: PackingItemDetail;
    scannedCodes: string[];
    visualInspectionPassed: boolean;
    disabled?: boolean;
    onScannedCodesChange: (codes: string[]) => void;
    onVisualInspectionChange: (passed: boolean) => void;
}

const normalizeCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export default function PackingScanPanel({
    item,
    scannedCodes,
    visualInspectionPassed,
    disabled = false,
    onScannedCodesChange,
    onVisualInspectionChange,
}: PackingScanPanelProps) {
    const [scanValue, setScanValue] = useState('');
    const [scanError, setScanError] = useState('');
    const expectedCode = useMemo(
        () => item.isbn?.trim() || `BOOK-${item.bookId}`,
        [item.bookId, item.isbn],
    );
    const complete = scannedCodes.length === item.quantity && visualInspectionPassed;

    const addScan = () => {
        if (disabled) return;
        const normalized = normalizeCode(scanValue);
        if (!normalized) {
            setScanError('Vui lòng quét hoặc nhập mã trên cuốn sách.');
            return;
        }
        const matchesExpectedCode = normalized === normalizeCode(expectedCode)
            || normalized === normalizeCode(String(item.bookId))
            || normalized === normalizeCode(`BOOK-${item.bookId}`);
        if (!matchesExpectedCode) {
            setScanError(`Mã không khớp. Hãy quét ISBN ${expectedCode} hoặc Book ID ${item.bookId}.`);
            return;
        }
        if (scannedCodes.length >= item.quantity) {
            setScanError(`Đã quét đủ ${item.quantity}/${item.quantity} cuốn.`);
            return;
        }
        onScannedCodesChange([...scannedCodes, scanValue.trim()]);
        setScanValue('');
        setScanError('');
    };

    return (
        <article className={`${styles.card} ${complete ? styles.complete : ''}`}>
            <div className={styles.bookInfo}>
                <div className={styles.cover}>
                    {item.bookCover ? <img src={item.bookCover} alt="" /> : <Barcode size={22} />}
                </div>
                <div className={styles.identity}>
                    <strong>{item.bookTitle}</strong>
                    <span>ISBN / barcode: <b>{expectedCode}</b></span>
                    <span className={styles.location}>
                        <MapPin size={13} /> {item.shelfLocation || 'Kệ chờ phân bổ'}
                    </span>
                </div>
                <div className={styles.quantity}>
                    <span>Cần lấy</span>
                    <strong>{item.quantity}</strong>
                    <small>cuốn</small>
                </div>
            </div>

            <div className={styles.scanRow}>
                <label htmlFor={`packing-scan-${item.bookId}`}>
                    <ScanLine size={15} /> Quét từng cuốn
                </label>
                <div className={styles.scanControl}>
                    <input
                        id={`packing-scan-${item.bookId}`}
                        value={scanValue}
                        disabled={disabled || scannedCodes.length >= item.quantity}
                        placeholder={scannedCodes.length >= item.quantity ? 'Đã quét đủ số lượng' : 'Đặt con trỏ rồi quét barcode'}
                        autoComplete="off"
                        onChange={(event) => {
                            setScanValue(event.target.value);
                            if (scanError) setScanError('');
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                addScan();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={addScan}
                        disabled={disabled || scannedCodes.length >= item.quantity}
                    >
                        Ghi nhận
                    </button>
                </div>
                <div className={styles.progress} aria-label={`Đã quét ${scannedCodes.length} trên ${item.quantity} cuốn`}>
                    {Array.from({ length: item.quantity }, (_, index) => (
                        <span key={index} className={index < scannedCodes.length ? styles.scanned : ''}>
                            {index < scannedCodes.length ? <Check size={12} /> : index + 1}
                        </span>
                    ))}
                    <b>{scannedCodes.length}/{item.quantity}</b>
                    {scannedCodes.length > 0 && !disabled && (
                        <button
                            type="button"
                            className={styles.reset}
                            onClick={() => {
                                onScannedCodesChange([]);
                                onVisualInspectionChange(false);
                                setScanError('');
                            }}
                        >
                            <RotateCcw size={13} /> Quét lại
                        </button>
                    )}
                </div>
                {scanError && <p className={styles.error}>{scanError}</p>}
            </div>

            <label className={`${styles.inspection} ${scannedCodes.length !== item.quantity ? styles.locked : ''}`}>
                <input
                    type="checkbox"
                    checked={visualInspectionPassed}
                    disabled={disabled || scannedCodes.length !== item.quantity}
                    onChange={(event) => onVisualInspectionChange(event.target.checked)}
                />
                <span className={styles.checkmark}><Check size={13} /></span>
                <span>
                    <strong>Đã kiểm tra ngoại quan đủ {item.quantity} cuốn</strong>
                    <small>Đúng đầu sách, không rách/mốc, bìa và ruột sách đạt yêu cầu.</small>
                </span>
            </label>
        </article>
    );
}
