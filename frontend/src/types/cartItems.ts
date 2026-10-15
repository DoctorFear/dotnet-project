export interface CartItem {
    cartItemId: number;
    bookId: number;
    title: string;
    author: string;
    coverImg: string;
    purchaseType: string;
    quantity: number;
    rentalDuration?: string;
    unitPrice: number;
    totalPrice: number;
    isSelected?: boolean;  
}

export interface CartItemDto {  
    item: any;
    onSelect: (id: number, isSelected: Boolean) => void;
    onFormatChange: (id: number, type: number) => void;
    onDurationChange: (id: number, duration: number) => void;
    onQtyChange: (id: number, delta: number) => void;
    onRemove: (id: number) => void;
}