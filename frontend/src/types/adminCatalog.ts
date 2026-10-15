import type { AdminBookStatus } from './book';

export type AdminBookTab = 'books' | 'categories' | 'publishers';

export type DraftValue = string | number | boolean | number[] | string[] | AdminBookStatus | null | undefined;
export type DraftFormState = Record<string, DraftValue>;

export interface ConfirmState {
    kind: AdminBookTab;
    id: number;
    title: string;
}
