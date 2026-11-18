import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LogIn, X } from 'lucide-react';
import styles from './CustomerChatWidget.module.css';

interface CustomerChatLoginNoticeProps {
    onClose: () => void;
}

export const CustomerChatLoginNotice: React.FC<CustomerChatLoginNoticeProps> = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div className={styles.loginNoticeBox}>
            <div className={styles.loginNoticeHeader}>
                <div className={styles.loginNoticeTitle}>
                    <MessageSquare size={16} />
                    Hỗ trợ trực tuyến Live Chat
                </div>
                <button type="button" className={styles.btnCloseNotice} onClick={onClose}>
                    <X size={14} />
                </button>
            </div>
            <div className={styles.loginNoticeBody}>
                <p>
                    Vui lòng đăng nhập tài khoản <b>ancientBOOK</b> để kết nối trò chuyện trực tuyến với đội ngũ tư vấn viên.
                </p>
                <button
                    type="button"
                    className={styles.btnLoginAction}
                    onClick={() => {
                        onClose();
                        navigate('/login');
                    }}
                >
                    <LogIn size={15} />
                    Đăng nhập ngay
                </button>
            </div>
        </div>
    );
};
