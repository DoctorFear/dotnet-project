import type { CreateCheckoutRequest, CreateCheckoutResponse, CreateMomoResponse } from "../types/checkout";
import { requestApi } from "./apiClient";

export const createOrder = async(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> => {
    return requestApi<CreateCheckoutResponse>('/checkout', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export const getMomoPaymentUrl = async(orderId: number): Promise<CreateMomoResponse> => {
    return requestApi<CreateMomoResponse>(`/checkout/${orderId}/momo-payment`, {
        method: 'POST'
    });
}