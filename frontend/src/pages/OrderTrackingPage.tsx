import React from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import OrderTrackingManagement from '../components/features/order-tracking/OrderTrackingManagement';
import styles from './OrderTrackingPage.module.css';

export const OrderTrackingPage: React.FC = () => {
    return (
        <div className={styles.pageWrapper}>
            <TopBar />
            <Header />
            <OrderTrackingManagement />
        </div>
    );
};

export default OrderTrackingPage;
