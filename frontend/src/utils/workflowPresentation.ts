export const workflowMoney = (value: number) =>
    `${value.toLocaleString('vi-VN')} đ`;

export const workflowNumber = (value: number) =>
    value.toLocaleString('vi-VN');

export const workflowDate = (value: string) =>
    new Date(value).toLocaleDateString('vi-VN');

export const workflowDateTime = (value: string) =>
    new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
