export * from '../types/warehouse';
export * from '../types/shipper';
import { warehouseService } from './warehouseService';
import { shipperService } from './shipperService';

export const warehouseLogisticsApi = {
    ...warehouseService,
    ...shipperService,
};
