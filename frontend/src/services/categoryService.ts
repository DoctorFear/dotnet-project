import type { CategoryData } from '../types/category';
import type { PagedResult } from '../types/book';
import { requestApi } from './apiClient';

export interface SaveCategoryRequest {
    name: string;
    parentId: number | null;
    description: string | null;
}

export const getCategories = () => requestApi<CategoryData[]>('/Category');

export const getPagedCategories = (searchTerm = '', pageNumber = 1, pageSize = 100) =>
    requestApi<PagedResult<CategoryData>>(`/Category/paged?searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);

export const createCategory = (data: SaveCategoryRequest) => requestApi<CategoryData>('/Category', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateCategory = (id: number, data: SaveCategoryRequest) => requestApi<CategoryData>(`/Category/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteCategory = (id: number) => requestApi<{ message: string }>(`/Category/${id}`, { method: 'DELETE' });
