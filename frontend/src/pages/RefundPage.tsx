import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RefundPage.module.css';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import { CheckCircle, X, Camera, Video, Truck, Package, CreditCard } from 'lucide-react';
import { useRefund } from '../hooks/useRefund';
import ToastNotification from '../components/common/ToastNotification';

export const RefundPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    
    const [reason, setReason] = useState<string>('defect');
    const [description, setDescription] = useState<string>('');
    const [shippingMethod, setShippingMethod] = useState<string>('pickup');
    const [bankAccount, setBankAccount] = useState<string>('');
    
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    
    const { submitRefund, isLoading, toasts, dismissToast } = useRefund();

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, [imagePreviews, videoPreview]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (imageFiles.length >= 6) {
                alert('Bạn chỉ được tải lên tối đa 6 hình ảnh!');
                return;
            }
            const file = e.target.files[0];
            const fileUrl = URL.createObjectURL(file);
            setImageFiles([...imageFiles, file]);
            setImagePreviews([...imagePreviews, fileUrl]);
        }
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (videoFile) {
                alert('Bạn chỉ được tải lên tối đa 1 video!');
                return;
            }
            const file = e.target.files[0];

            if (file.size > 50 * 1024 * 1024) {
                alert('Dung lượng video không được vượt quá 50MB!');
                return;
            }

            const fileUrl = URL.createObjectURL(file);
            setVideoFile(file);
            setVideoPreview(fileUrl);
        }
    };
    
    const removeImage = (index: number) => {
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };
    
    const removeVideo = () => {
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoFile(null);
        setVideoPreview(null);
    };

    const handleSubmitRefund = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankAccount.trim()) {
            alert('Vui lòng nhập thông tin tài khoản nhận tiền hoàn!');
            return;
        }
        
        if (!orderId) {
            alert('Không tìm thấy mã đơn hàng!');
            return;
        }

        await submitRefund({
            orderId: parseInt(orderId),
            reason,
            shippingMethod,
            description,
            bankAccount,
            images: imageFiles,
            video: videoFile
        }, () => {
            setIsSubmitted(true);
            setTimeout(() => {
                navigate('/order-history');
            }, 3000);
        });
    };

    return (
        <div className={styles.refundBody}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header />

            <div className={styles.refundContainer}>
                
                {/* TIMELINE TRẠNG THÁI */}
                <div className={styles.timelineCard}>
                    <h3 className={styles.cardTitle}>Quy trình Trả hàng / Hoàn tiền đơn #{orderId}</h3>
                    <div className={styles.timelineList}>
                        <div className={`${styles.timelineStep} ${isSubmitted ? styles.completed : styles.active}`}>
                            <div className={styles.stepIcon}>{isSubmitted ? <CheckCircle size={18} /> : '1'}</div>
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

                <form className={styles.formCard} onSubmit={handleSubmitRefund}>
                    <h3 className={styles.cardTitle}>Chi tiết yêu cầu hoàn tiền</h3>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lý do trả hàng / hoàn tiền</label>
                        <select 
                            className={styles.formSelect}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isSubmitted || isLoading}
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
                                    disabled={isSubmitted || isLoading}
                                />
                                <div className={styles.shippingInfo}>
                                    <h4><Truck size={14} style={{marginRight: '6px', verticalAlign: 'middle', color: 'inherit'}}/> Đơn vị vận chuyển đến lấy hàng</h4>
                                    <p>Miễn phí ship hoàn về</p>
                                </div>
                            </label>

                            <label className={`${styles.shippingCard} ${shippingMethod === 'dropoff' ? styles.active : ''}`}>
                                <input 
                                    type="radio" 
                                    name="shipping" 
                                    checked={shippingMethod === 'dropoff'} 
                                    onChange={() => setShippingMethod('dropoff')}
                                    disabled={isSubmitted || isLoading}
                                />
                                <div className={styles.shippingInfo}>
                                    <h4><Package size={14} style={{marginRight: '6px', verticalAlign: 'middle', color: 'inherit'}}/> Trả hàng tại bưu cục</h4>
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
                                    <span>Bạn (Theo địa chỉ giao hàng của đơn)</span>
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
                            disabled={isSubmitted || isLoading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Đăng tải hình ảnh (Tối đa 6) & Video (Tối đa 1)</label>
                        <div className={styles.uploadSection}>
                            {imagePreviews.map((img, index) => (
                                <div className={styles.previewItem} key={index}>
                                    <img src={img} alt="preview" />
                                    {!isSubmitted && !isLoading && (
                                        <button 
                                            type="button" 
                                            className={styles.removeBtn}
                                            onClick={() => removeImage(index)}
                                        >
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {imagePreviews.length < 6 && !isSubmitted && !isLoading && (
                                <label className={styles.uploadSlot}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                                    <Camera className={styles.uploadIcon} />
                                    <span className={styles.uploadText}>Thêm ảnh ({imagePreviews.length}/6)</span>
                                </label>
                            )}

                            {videoPreview && (
                                <div className={styles.previewItem}>
                                    <video src={videoPreview} />
                                    {!isSubmitted && !isLoading && (
                                        <button 
                                            type="button" 
                                            className={styles.removeBtn}
                                            onClick={removeVideo}
                                        >
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {!videoPreview && !isSubmitted && !isLoading && (
                                <label className={styles.uploadSlot}>
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} />
                                    <Video className={styles.uploadIcon} />
                                    <span className={styles.uploadText}>Thêm Video (0/1)</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            <CreditCard size={15} style={{marginRight: '6px', verticalAlign: 'middle', color: 'var(--catalina)'}}/>
                            Tài khoản nhận tiền hoàn
                        </label>
                        <input 
                            type="text"
                            className={styles.formInput}
                            placeholder="VD: STK - Ngân hàng / Ví điện tử"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            disabled={isSubmitted || isLoading}
                        />
                    </div>

                    <div className={styles.submitActionArea}>
                        <button 
                            type="submit" 
                            className={`${styles.btnSubmit} ${isSubmitted ? styles.submitted : ''}`}
                            disabled={isSubmitted || isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : isSubmitted ? 'Đã gửi đơn hoàn tiền' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RefundPage;