import { useState, useMemo, useEffect } from 'react';
import { createOrder, getMomoPaymentUrl, getSePayPaymentUrl } from '../services/checkoutService';
import { userService } from '../services/userService';
import type { Address } from '../types/address';
import { useNavigate } from 'react-router-dom';
import { useCheckoutPoints } from './useCheckoutPoints';

export const useCheckout = (cartItems: any[]) => {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddrId, setSelectedAddrId] = useState<number>(0);
    const [, setUserId] = useState<number>(0);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(true);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [pointsInput, setPointsInput] = useState('');
    const pointsUsed = Number(pointsInput) || 0;
    const [shippingFee] = useState<number>(0);
    
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [orderCode, setOrderCode] = useState<string>('');

    useEffect(() => {
        let isMounted = true;

        const fetchUserAddresses = async () => {
            setIsLoadingAddresses(true);
            try {
                const res = await userService.getProfile();
                if (!isMounted) return;

                if (res.success && res.data) {
                    const profile = res.data;
                    setUserId(profile.id);

                    const mappedAddresses: Address[] = (profile.addresses || []).map((addr, index) => ({
                        id: addr.id ?? index + 1,
                        name: profile.fullName || profile.username,
                        phone: profile.phoneNumber,
                        email: profile.email,
                        address: [addr.streetAddress, addr.ward, addr.province]
                            .filter(Boolean)
                            .join(', '),
                        isDefault: addr.isDefault,
                    }));

                    setAddresses(mappedAddresses);

                    if (mappedAddresses.length > 0) {
                        const defaultAddr = mappedAddresses.find((a) => a.isDefault) || mappedAddresses[0];
                        setSelectedAddrId(defaultAddr.id);
                    }
                }
            } catch (err) {
                console.error('Failed to load user addresses:', err);
            } finally {
                if (isMounted) setIsLoadingAddresses(false);
            }
        };

        fetchUserAddresses();
        return () => {
            isMounted = false;
        };
    }, []);

    const subTotal = useMemo(() => {
        return cartItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    }, [cartItems]);
    const { maxPoints: userMaxPoints, error: pointError } = useCheckoutPoints(subTotal);

    const discountVal = pointsUsed * 100; 
    const finalTotal = Math.max(0, subTotal + shippingFee - discountVal);

    const handlePointsChange = (input: string) => {
        if (!/^\d*$/.test(input)) return;
        let val = Number(input);
        if (!Number.isSafeInteger(val)) return;
        if (val > userMaxPoints) val = userMaxPoints;
        
        const maxAllowedBySubtotal = Math.floor((subTotal * 0.5) / 100); 
        if (val > maxAllowedBySubtotal) val = maxAllowedBySubtotal;
        
        setPointsInput(input === '' ? '' : String(val));
    };

    const submitCheckout = async (userId: number) => {
        if (!cartItems || cartItems.length === 0) return;

        const selectedAddress = addresses.find((a) => a.id === selectedAddrId);
        if (!selectedAddress) {
            alert('Vui lòng chọn hoặc cập nhật địa chỉ nhận hàng trước khi đặt đơn!');
            return;
        }
        
        setIsProcessing(true);
        setError(null);
        
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
                    const momoData = await getMomoPaymentUrl(data.orderId);
                    if (momoData.payUrl) {
                        window.open(momoData.payUrl, '_blank');
                        return;
                    }
                } catch (momoErr) {
                    console.log(momoErr)
                    alert("Không thể khởi tạo thanh toán MoMo. Đơn hàng đã được lưu dưới dạng COD.");
                }
            }

            if (paymentMethod === 'sepay') {
                try {
                    const sepayData = await getSePayPaymentUrl(data.orderId);
                    if (sepayData.payUrl) {
                        navigate('/sepay-payment', { 
                            state: { 
                                orderId: data.orderId,
                                amount: finalTotal,
                                qrUrl: sepayData.payUrl
                            } 
                        });
                        return;
                    }
                } catch (sepayErr) {
                    console.error("SePay Error:", sepayErr);
                    alert("Không thể khởi tạo thanh toán SePay. Đơn hàng đã được lưu dưới dạng COD.");
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
        isLoadingAddresses,
        paymentMethod,
        setPaymentMethod,
        pointsUsed,
        pointsInput,
        userMaxPoints,
        pointError,
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
        submitCheckout,
    };
};
