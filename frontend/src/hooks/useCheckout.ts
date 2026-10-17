// src/hooks/useCheckout.ts
import { useState, useMemo } from 'react';
import { createOrder, getMomoPaymentUrl } from '../services/checkoutService';
import type { Address } from '../types/address';

export const useCheckout = (cartItems: any[]) => {
    const [addresses, setAddresses] = useState<Address[]>([
        {
            id: 1,
            name: 'Thanh Sang',
            phone: '0912345678',
            email: 'thansang@dev.com',
            address: '128 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
            isDefault: true,
        }
    ]);
    
    const [selectedAddrId, setSelectedAddrId] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [pointsUsed, setPointsUsed] = useState<number>(0);
    const [userMaxPoints, setUserMaxPoints] = useState<number>(500); 
    const [shippingFee, setShippingFee] = useState<number>(15000);
    
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [orderCode, setOrderCode] = useState<string>('');

    const subTotal = useMemo(() => {
        return cartItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    }, [cartItems]);

    const discountVal = pointsUsed * 100; 
    const finalTotal = Math.max(0, subTotal + shippingFee - discountVal);

    const handlePointsChange = (val: number) => {
        if (isNaN(val) || val < 0) val = 0;
        if (val > userMaxPoints) val = userMaxPoints;
        
        const maxAllowedBySubtotal = Math.floor((subTotal * 0.5) / 100); 
        if (val > maxAllowedBySubtotal) val = maxAllowedBySubtotal;
        
        setPointsUsed(val);
    };

    const submitCheckout = async (userId: number) => {
        if (!cartItems || cartItems.length === 0) return;
        
        setIsProcessing(true);
        setError(null);
        
        const selectedAddress = addresses.find(a => a.id === selectedAddrId);
        
        const checkoutRequest = {
            userId,
            pointsUsed: pointsUsed > 0 ? pointsUsed : null,
            shippingAddress: selectedAddress?.address || '',
            items: cartItems.map((item: any) => ({
                bookId: item.bookId, 
                quantity: item.quantity,
                purchaseType: item.purchaseType,
                rentalDuration: item.rentalDuration
            }))
        };

        try {
            const data = await createOrder(checkoutRequest);

            if (paymentMethod === 'momo') {
                try {
                    console.log(data.orderId)
                    const momoData = await getMomoPaymentUrl(data.orderId);
                    if (momoData.payUrl) {
                        window.location.href = momoData.payUrl;
                        return;
                    }
                } catch (momoErr) {
                    console.log(momoErr)
                    alert("Không thể khởi tạo thanh toán MoMo. Đơn hàng đã được lưu dưới dạng COD.");
                }
            }

            setOrderCode(data.orderId.toString());
            setIsSuccessModalOpen(true);

        } catch (err: any) {
            console.error("Checkout Error:", err);
            setError(err.message || "Có lỗi xảy ra trong quá trình đặt hàng!");
            alert("Có lỗi xảy ra trong quá trình đặt hàng!");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        addresses,
        selectedAddrId,
        setSelectedAddrId,
        paymentMethod,
        setPaymentMethod,
        pointsUsed,
        userMaxPoints,
        handlePointsChange,
        shippingFee,
        subTotal,
        discountVal,
        finalTotal,
        isProcessing,
        error,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        orderCode,
        submitCheckout
    };
};