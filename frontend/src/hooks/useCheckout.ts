import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getMomoPaymentUrl, getSePayPaymentUrl } from '../services/checkoutService';
import { userService } from '../services/userService';
import type { Address } from '../types/address';
import { useCheckoutPoints } from './useCheckoutPoints';
import { useUser } from '../context/UserContext';
import { workflowService } from '../services/workflowService';

export interface CheckoutItem {
    cartItemId?: number;
    bookId: number;
    title: string;
    coverImg?: string;
    quantity: number;
    unitPrice: number;
    purchaseType?: number | string;
    rentalDuration?: number | string | null;
}

const normalizePurchaseType = (value: CheckoutItem['purchaseType']): number => {
    if (typeof value === 'number' && [1, 2, 3].includes(value)) return value;
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === '1' || normalized === 'physical') return 1;
    if (normalized === '2' || normalized === 'rental') return 2;
    if (normalized === '3' || normalized === 'ebook') return 3;
    throw new Error('Hình thức mua sách không hợp lệ.');
};

const normalizeRentalDuration = (value: CheckoutItem['rentalDuration']): number | null => {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && [1, 2, 3].includes(value)) return value;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === '1' || normalized === 'weekly') return 1;
    if (normalized === '2' || normalized === 'monthly') return 2;
    if (normalized === '3' || normalized === 'yearly') return 3;
    throw new Error('Thời hạn thuê sách không hợp lệ.');
};

export const useCheckout = (cartItems: CheckoutItem[]) => {
    const navigate = useNavigate();
    const { user, updateUser } = useUser();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddrId, setSelectedAddrId] = useState<number>(0);
    const [userId, setUserId] = useState<number>(0);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(true);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [pointsEnabled, setPointsEnabledState] = useState(false);
    const [pointsInput, setPointsInput] = useState('');
    const [pointsUsed, setPointsUsed] = useState(0);
    const [pointsMessage, setPointsMessage] = useState('');
    const [pointsValidationError, setPointsValidationError] = useState('');
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
                        const defaultAddress = mappedAddresses.find((address) => address.isDefault) || mappedAddresses[0];
                        setSelectedAddrId(defaultAddress.id);
                    }
                }
            } catch (cause) {
                console.error('Failed to load user addresses:', cause);
            } finally {
                if (isMounted) setIsLoadingAddresses(false);
            }
        };

        void fetchUserAddresses();
        return () => {
            isMounted = false;
        };
    }, []);

    const subTotal = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [cartItems],
    );
    const {
        maxPoints: userMaxPoints,
        availablePoints,
        pendingPoints,
        loading: pointsLoading,
        error: pointsLoadError,
    } = useCheckoutPoints(subTotal);

    const discountVal = pointsUsed * 100;
    const finalTotal = Math.max(0, subTotal + shippingFee - discountVal);

    const clearAppliedPoints = (message = '') => {
        setPointsInput('');
        setPointsUsed(0);
        setPointsMessage(message);
        setPointsValidationError('');
    };

    const setPointsEnabled = (enabled: boolean) => {
        if (!enabled) {
            setPointsEnabledState(false);
            clearAppliedPoints('Đã bỏ áp dụng F-Point. Tổng thanh toán đã được khôi phục.');
            return;
        }
        if (pointsLoading || pointsLoadError || userMaxPoints <= 0) return;
        setPointsEnabledState(true);
        setPointsMessage('Nhập số điểm muốn dùng rồi nhấn “Áp dụng”.');
        setPointsValidationError('');
    };

    const handlePointsInputChange = (input: string) => {
        setPointsInput(input);
        setPointsValidationError('');
        if (pointsUsed > 0 && Number(input) !== pointsUsed) {
            setPointsMessage('Giá trị vừa nhập chưa được áp dụng vào đơn hàng.');
        } else if (pointsUsed === 0) {
            setPointsMessage('');
        }
    };

    const validatePointValue = (value: number): string => {
        if (!Number.isSafeInteger(value) || value <= 0) {
            return 'Vui lòng nhập số F-Point nguyên dương.';
        }
        if (value > availablePoints || value > userMaxPoints) {
            return `Số điểm sử dụng không hợp lệ hoặc vượt quá hạn mức tối đa được phép dùng cho đơn hàng này (${userMaxPoints.toLocaleString('vi-VN')} điểm)!`;
        }
        return '';
    };

    const applyPoints = (requestedValue?: number) => {
        const raw = requestedValue == null ? pointsInput.trim() : String(requestedValue);
        if (!/^\d+$/.test(raw)) {
            setPointsValidationError('Vui lòng nhập số F-Point nguyên dương.');
            return false;
        }
        const value = Number(raw);
        const validation = validatePointValue(value);
        if (validation) {
            setPointsValidationError(validation);
            return false;
        }
        setPointsInput(String(value));
        setPointsUsed(value);
        setPointsValidationError('');
        setPointsMessage(
            `Áp dụng thành công ${value.toLocaleString('vi-VN')} F-Point, giảm ${(value * 100).toLocaleString('vi-VN')} đ.`,
        );
        return true;
    };

    const selectSuggestedPoints = (value: number) => {
        setPointsEnabledState(true);
        setPointsInput(String(value));
        setPointsValidationError('');
        setPointsMessage(
            value === pointsUsed && pointsUsed > 0
                ? `Đang áp dụng ${value.toLocaleString('vi-VN')} F-Point.`
                : `Đã chọn ${value.toLocaleString('vi-VN')} F-Point. Nhấn “Áp dụng” để cập nhật tổng thanh toán.`,
        );
    };

    const selectMaximumPoints = () => selectSuggestedPoints(userMaxPoints);
    const clearPoints = () => clearAppliedPoints('Đã bỏ áp dụng F-Point. Tổng thanh toán đã được khôi phục.');

    useEffect(() => {
        if (pointsLoading || pointsUsed <= userMaxPoints) return undefined;
        const timer = window.setTimeout(() => {
            if (userMaxPoints <= 0) {
                setPointsEnabledState(false);
                setPointsInput('');
                setPointsUsed(0);
                setPointsValidationError('');
                setPointsMessage('F-Point đã áp dụng được gỡ vì đơn hàng không còn đủ điều kiện.');
                return;
            }
            setPointsInput(String(userMaxPoints));
            setPointsUsed(userMaxPoints);
            setPointsValidationError('');
            setPointsMessage(
                `Giá trị đơn hàng đã thay đổi. Hệ thống điều chỉnh về mức tối đa ${userMaxPoints.toLocaleString('vi-VN')} F-Point.`,
            );
        }, 0);
        return () => window.clearTimeout(timer);
    }, [pointsLoading, pointsUsed, userMaxPoints]);

    const submitCheckout = async () => {
        if (cartItems.length === 0) return;
        if (userId <= 0) {
            alert('Không xác định được tài khoản đặt hàng. Vui lòng đăng nhập lại.');
            return;
        }

        const selectedAddress = addresses.find((address) => address.id === selectedAddrId);
        if (!selectedAddress) {
            alert('Vui lòng chọn hoặc cập nhật địa chỉ nhận hàng trước khi đặt đơn!');
            return;
        }

        setIsProcessing(true);
        setError(null);
        try {
            const checkoutRequest = {
                userId,
                pointsUsed: pointsUsed > 0 ? pointsUsed : null,
                shippingAddress: selectedAddress.address,
                items: cartItems.map((item) => ({
                    bookId: item.bookId,
                    quantity: item.quantity,
                    purchaseType: normalizePurchaseType(item.purchaseType),
                    rentalDuration: normalizeRentalDuration(item.rentalDuration),
                })),
            };
            const data = await createOrder(checkoutRequest);

            if (pointsUsed > 0) {
                void workflowService.balance().then(
                    (balance) => updateUser({ fPoints: balance.currentPoints }),
                    () => user && updateUser({ fPoints: Math.max(0, user.fPoints - pointsUsed) }),
                );
            }

            if (paymentMethod === 'momo') {
                try {
                    const momoData = await getMomoPaymentUrl(data.orderId);
                    if (momoData.payUrl) {
                        window.open(momoData.payUrl, '_blank');
                        return;
                    }
                } catch (momoError) {
                    console.error(momoError);
                    alert('Không thể khởi tạo thanh toán MoMo. Đơn hàng đã được lưu dưới dạng COD.');
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
                                qrUrl: sepayData.payUrl,
                            },
                        });
                        return;
                    }
                } catch (sepayError) {
                    console.error('SePay Error:', sepayError);
                    alert('Không thể khởi tạo thanh toán SePay. Đơn hàng đã được lưu dưới dạng COD.');
                }
            }

            setOrderCode(data.orderId.toString());
            setIsSuccessModalOpen(true);
        } catch (cause: unknown) {
            console.error('Checkout Error:', cause);
            const message = cause instanceof Error ? cause.message : 'Có lỗi xảy ra trong quá trình đặt hàng!';
            setError(message);
            alert(message);
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
        pointsEnabled,
        setPointsEnabled,
        pointsUsed,
        pointsInput,
        userMaxPoints,
        availablePoints,
        pendingPoints,
        pointsLoading,
        pointsMessage,
        pointsValidationError,
        pointsLoadError,
        handlePointsInputChange,
        applyPoints,
        selectSuggestedPoints,
        selectMaximumPoints,
        clearPoints,
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
