import type { MemberReview } from '../../../types/workflow';

export const parseImages = (value: string | null): string[] => {
    try {
        const items: unknown = JSON.parse(value || '[]');
        return Array.isArray(items)
            ? items.filter(
                  (item): item is string =>
                      typeof item === 'string' && /^(https?:|blob:)/i.test(item),
              )
            : [];
    } catch {
        return [];
    }
};

export const editable = (review: MemberReview) =>
    Date.now() <= new Date(review.createdAt).getTime() + 30 * 86400000;
