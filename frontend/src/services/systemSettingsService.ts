import { requestApi } from './apiClient';
import type { SystemSettings } from '../types/systemSettings';

export const getSystemSettings = () => requestApi<SystemSettings>('/SystemSettings');
export const saveSystemSettings = (settings: SystemSettings) => requestApi<{ message: string }>('/SystemSettings', { method: 'PUT', body: JSON.stringify(settings) });
export const restoreSystemSettings = () => requestApi<{ message: string }>('/SystemSettings/restore-default', { method: 'POST' });
