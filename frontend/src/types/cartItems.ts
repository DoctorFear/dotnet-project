export interface CartItem {
    id: number;
    title: string;
    author: string;
    price: number;
    origPrice: number;
    img: string;
    qty: number;
    selected: boolean;
}