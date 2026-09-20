export interface CategoryData {
    id: number;
    name: string;
    parentId?: number | null;
    description?: string | null;
    bookCount?: number;
}
