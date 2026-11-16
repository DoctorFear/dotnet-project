import React from 'react';
import { ArrowLeft, CheckCircle, Image as ImageIcon, Video, CreditCard, Truck, FileText } from 'lucide-react';
import { getRefundOrderStatusMeta, type RefundResponseDto } from '../../../types/refund';
import styles from './AdminRefund.module.css';


interface Props {
    detail: RefundResponseDto;
    onBack: () => void;
    onApprove: (orderId: number) => void;
}

export const AdminRefundDetail: React.FC<Props> = ({ detail, onBack, onApprove }) => {
    const statusMeta = getRefundOrderStatusMeta(detail.orderStatus);

    return (
        <div className={styles.wrapperDetail}>
            {/* Header */}
            <div className={styles.detailHeader}>
                <button type="button" onClick={onBack} className={styles.btnBack}>
                    <ArrowLeft size={18} className={styles.iconMr} />
                    Quay lại danh sách
                </button>

                <div className={styles.detailHeaderActions}>
                    <span
                        className={`${styles.statusBadge} ${
                            statusMeta.tone === 'pending'
                                ? styles.statusPending
                                : statusMeta.tone === 'returned'
                                ? styles.statusReturned
                                : styles.statusDefault
                        }`}
                    >
                        {statusMeta.label}
                    </span>

                    {statusMeta.canApprove && (
                        <button
                            type="button"
                            onClick={() => onApprove(detail.orderId)}
                            className={styles.btnApproveLg}
                        >
                            <CheckCircle size={18} className={styles.iconMr} />
                            Duyệt hoàn trả
                        </button>
                    )}
                </div>
            </div>

            {/* Info Grid */}
            <div className={styles.grid2Col}>
                <div className={styles.sectionCol}>
                    <h3 className={styles.sectionTitle}>Thông tin yêu cầu</h3>

                    <div className={styles.infoCard}>
                        <FileText size={20} className={styles.infoIconBlue} />
                        <div>
                            <p className={styles.infoLabel}>Lý do hoàn trả</p>
                            <p className={styles.infoValue}>{detail.reason}</p>
                        </div>
                    </div>

                    <div className={styles.infoCard}>
                        <FileText size={20} className={styles.infoIconGray} />
                        <div>
                            <p className={styles.infoLabel}>Mô tả chi tiết</p>
                            <p className={styles.infoValueDesc}>{detail.description || 'Không có mô tả'}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionCol}>
                    <h3 className={styles.sectionTitle}>Giao dịch &amp; Vận chuyển</h3>

                    <div className={styles.infoCardBlue}>
                        <CreditCard size={20} className={styles.infoIconBlue} />
                        <div>
                            <p className={styles.infoLabelBlue}>Tài khoản nhận tiền (STK - Ngân hàng)</p>
                            <p className={styles.infoValueBlue}>{detail.bankAccount}</p>
                        </div>
                    </div>

                    <div className={styles.infoCardOrange}>
                        <Truck size={20} className={styles.infoIconOrange} />
                        <div>
                            <p className={styles.infoLabelOrange}>Phương thức gửi hàng lại</p>
                            <p className={styles.infoValueOrange}>{detail.shippingMethod}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Evidence */}
            <h3 className={styles.evidenceTitle}>Bằng chứng đính kèm</h3>
            <div className={styles.evidenceSection}>
                <div>
                    <h4 className={styles.evidenceSubtitle}>
                        <ImageIcon size={16} className={styles.iconMr} /> Hình ảnh ({detail.imageUrls?.length || 0})
                    </h4>
                    {detail.imageUrls && detail.imageUrls.length > 0 ? (
                        <div className={styles.imageGrid}>
                            {detail.imageUrls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className={styles.imageLink}>
                                    <img src={url} alt={`Evidence ${idx + 1}`} className={styles.imageElement} />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.emptyEvidence}>Không có hình ảnh đính kèm</p>
                    )}
                </div>

                <div>
                    <h4 className={styles.evidenceSubtitle}>
                        <Video size={16} className={styles.iconMr} /> Video bằng chứng
                    </h4>
                    {detail.videoUrl ? (
                        <div className={styles.videoContainer}>
                            <video src={detail.videoUrl} controls className={styles.videoElement} />
                        </div>
                    ) : (
                        <p className={styles.emptyEvidence}>Không có video đính kèm</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRefundDetail;