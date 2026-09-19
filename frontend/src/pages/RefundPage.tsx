import React, { useState } from 'react';
import styles from './RefundPage.module.css';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';

export const RefundPage: React.FC = () => {
    const [reason, setReason] = useState<string>('defect');
    const [description, setDescription] = useState<string>('');
    const [shippingMethod, setShippingMethod] = useState<string>('pickup');
    const [bankAccount, setBankAccount] = useState<string>('');
    
    // Quản lý file ảnh (tối đa 6) và video (tối đa 1)
    const [images, setImages] = useState<string[]>([]);
    const [video, setVideo] = useState<string | null>(null);

    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (images.length >= 6) {
                alert('Bạn chỉ được tải lên tối đa 6 hình ảnh!');
                return;
            }
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setImages([...images, fileUrl]);
        }
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (video) {
                alert('Bạn chỉ được tải lên tối đa 1 video!');
                return;
            }
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setVideo(fileUrl);
        }
    };

    const handleSubmitRefund = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankAccount.trim()) {
            alert('Vui lòng nhập thông tin tài khoản nhận tiền hoàn!');
            return;
        }
        setIsSubmitted(true);
    };

    return (
        <div className={styles.refundBody}>
            <TopBar />
            <Header />

            <div className={styles.refundContainer}>
                
                {/* TIMELINE TRẠNG THÁI */}
                <div className={styles.timelineCard}>
                    <h3 className={styles.cardTitle}>Quy trình Trả hàng / Hoàn tiền</h3>
                    <div className={styles.timelineList}>
                        <div className={`${styles.timelineStep} ${isSubmitted ? styles.completed : styles.active}`}>
                            <div className={styles.stepIcon}>{isSubmitted ? '✓' : '1'}</div>
                            <span className={styles.stepLabel}>Gửi yêu cầu</span>
                        </div>
                        <div className={styles.timelineStep}>
                            <div className={styles.stepIcon}>2</div>
                            <span className={styles.stepLabel}>Trả hàng</span>
                        </div>
                        <div className={styles.timelineStep}>
                            <div className={styles.stepIcon}>3</div>
                            <span className={styles.stepLabel}>Kiểm tra hàng hoàn</span>
                        </div>
                        <div className={styles.timelineStep}>
                            <div className={styles.stepIcon}>4</div>
                            <span className={styles.stepLabel}>Hoàn tiền</span>
                        </div>
                    </div>
                </div>

                {/* FORM CHI TIẾT */}
                <form className={styles.formCard} onSubmit={handleSubmitRefund}>
                    <h3 className={styles.cardTitle}>Chi tiết yêu cầu hoàn tiền</h3>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lý do trả hàng / hoàn tiền</label>
                        <select 
                            className={styles.formSelect}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isSubmitted}
                        >
                            <option value="defect">Hàng bị lỗi, hỏng, không hoạt động</option>
                            <option value="wrong_item">Nhận sai sản phẩm / thiếu sản phẩm</option>
                            <option value="fake">Hàng giả, hàng nhái</option>
                            <option value="not_described">Sản phẩm khác với mô tả</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Chọn phương thức trả hàng</label>
                        <div className={styles.shippingOptionsGrid}>
                            <label className={`${styles.shippingCard} ${shippingMethod === 'pickup' ? styles.active : ''}`}>
                                <input 
                                    type="radio" 
                                    name="shipping" 
                                    checked={shippingMethod === 'pickup'} 
                                    onChange={() => setShippingMethod('pickup')}
                                    disabled={isSubmitted}
                                />
                                <div className={styles.shippingInfo}>
                                    <h4>Đơn vị vận chuyển đến lấy hàng</h4>
                                    <p>Miễn phí ship hoàn về</p>
                                </div>
                            </label>

                            <label className={`${styles.shippingCard} ${shippingMethod === 'dropoff' ? styles.active : ''}`}>
                                <input 
                                    type="radio" 
                                    name="shipping" 
                                    checked={shippingMethod === 'dropoff'} 
                                    onChange={() => setShippingMethod('dropoff')}
                                    disabled={isSubmitted}
                                />
                                <div className={styles.shippingInfo}>
                                    <h4>Trả hàng tại bưu cục</h4>
                                    <p>Miễn phí ship hoàn về</p>
                                </div>
                            </label>
                        </div>

                        {shippingMethod === 'pickup' && (
                            <div className={styles.pickupDetailsBox}>
                                <div className={styles.pickupRow}>
                                    <span>Đơn vị vận chuyển:</span>
                                    <span>Nhanh THHT</span>
                                </div>
                                <div className={styles.pickupRow}>
                                    <span>Thời gian lấy dự kiến:</span>
                                    <span>1-3 ngày tới</span>
                                </div>
                                <div className={styles.pickupRow}>
                                    <span>Địa chỉ lấy hàng:</span>
                                    <span>Thanh Sang • 0912345678 (128 Nguyễn Thị Minh Khai, Q.1, TP.HCM)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Mô tả chi tiết</label>
                        <textarea 
                            className={styles.formTextarea}
                            placeholder="Mô tả tình trạng sản phẩm gặp phải..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitted}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Đăng tải hình ảnh (Tối đa 6) & Video (Tối đa 1)</label>
                        <div className={styles.uploadSection}>
                            {/* Render danh sách ảnh đã chọn */}
                            {images.map((img, index) => (
                                <div className={styles.previewItem} key={index}>
                                    <img src={img} alt="preview" />
                                    {!isSubmitted && (
                                        <button 
                                            type="button" 
                                            className={styles.removeBtn}
                                            onClick={() => setImages(images.filter((_, i) => i !== index))}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Nút thêm ảnh */}
                            {images.length < 6 && !isSubmitted && (
                                <label className={styles.uploadSlot}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                                    <span className={styles.uploadIcon}>📷</span>
                                    <span className={styles.uploadText}>Thêm ảnh ({images.length}/6)</span>
                                </label>
                            )}

                            {/* Render Video đã chọn */}
                            {video && (
                                <div className={styles.previewItem}>
                                    <video src={video} />
                                    {!isSubmitted && (
                                        <button 
                                            type="button" 
                                            className={styles.removeBtn}
                                            onClick={() => setVideo(null)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Nút thêm video */}
                            {!video && !isSubmitted && (
                                <label className={styles.uploadSlot}>
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} />
                                    <span className={styles.uploadIcon}>🎥</span>
                                    <span className={styles.uploadText}>Thêm Video (0/1)</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tài khoản nhận tiền hoàn</label>
                        <input 
                            type="text"
                            className={styles.formInput}
                            placeholder="VD: STK - Ngân hàng / Ví điện tử"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            disabled={isSubmitted}
                        />
                    </div>

                    <div className={styles.submitActionArea}>
                        <button 
                            type="submit" 
                            className={`${styles.btnSubmit} ${isSubmitted ? styles.submitted : ''}`}
                            disabled={isSubmitted}
                        >
                            {isSubmitted ? 'Đã gửi đơn hoàn tiền' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default RefundPage;