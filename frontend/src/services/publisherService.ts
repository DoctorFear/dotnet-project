import type { PublisherData } from '../types/publisher';
import type { PagedResult } from '../types/book';
import { requestApi } from './apiClient';

export interface SavePublisherRequest {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
}

export const getPublishers = () => requestApi<PublisherData[]>('/Publisher');

export const getPagedPublishers = (searchTerm = '', pageNumber = 1, pageSize = 100) =>
    requestApi<PagedResult<PublisherData>>(`/Publisher/paged?searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);

export const createPublisher = (data: SavePublisherRequest) => requestApi<PublisherData>('/Publisher', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updatePublisher = (id: number, data: SavePublisherRequest) => requestApi<PublisherData>(`/Publisher/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deletePublisher = (id: number) => requestApi<{ message: string }>(`/Publisher/${id}`, { method: 'DELETE' });
