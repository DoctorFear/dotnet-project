import {
    ChevronLeft,
    ChevronRight,
    Clock3,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useShipperPortal } from '../../../hooks/useShipperPortal';
import type { DeliveryStatus } from '../../../types/workflow';
import ShipperOrderCard from './ShipperOrderCard';
import { EmptyState, WorkflowError } from '../workflow/WorkflowShared';
import styles from './ShipperPortal.module.css';
import { tabs } from './shipperMeta';

type Shipper = ReturnType<typeof useShipperPortal>;

interface ShipperOrderListProps {
    shipper: Shipper;
    onOpenAction: (id: number, status: DeliveryStatus) => void;
}

export default function ShipperOrderList({
    shipper,
    onOpenAction,
}: ShipperOrderListProps) {
    return (
        <main className={styles.content}>
            <form
                className={styles.search}
                onSubmit={(event) => {
                    event.preventDefault();
                    shipper.search(String(new FormData(event.currentTarget).get('keyword') ?? ''));
                }}
            >
                <Search size={18} />
                <input
                    name="keyword"
                    aria-label="Tìm mã đơn hoặc tên khách"
                    placeholder="Tìm mã đơn, tên khách hàng..."
                />
                <button type="submit" aria-label="Tìm kiếm đơn">
                    <ChevronRight size={18} />
                </button>
            </form>
            <div className={styles.tabs} role="tablist" aria-label="Trạng thái giao hàng">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={shipper.status === tab.value}
                        key={tab.value}
                        onClick={() => shipper.filter(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className={styles.resultHeading}>
                <span>{shipper.orders.data?.totalCount ?? '—'} đơn hàng</span>
                <small>
                    <Clock3 size={12} /> Ưu tiên đơn chưa hoàn tất
                </small>
            </div>
            {shipper.error && !shipper.action && <WorkflowError message={shipper.error} />}
            {shipper.orders.error ? (
                <WorkflowError message={shipper.orders.error} retry={shipper.orders.reload} />
            ) : shipper.orders.loading ? (
                <div className={styles.loading} role="status">
                    Đang tải đơn được phân công...
                </div>
            ) : shipper.orders.data?.items.length === 0 ? (
                <EmptyState
                    title="Chưa có đơn phù hợp"
                    detail="Thử đổi trạng thái hoặc từ khóa tìm kiếm."
                />
            ) : (
                shipper.orders.data?.items.map((order) => (
                    <ShipperOrderCard
                        key={order.orderId}
                        order={order}
                        shipper={shipper}
                        onOpenAction={onOpenAction}
                    />
                ))
            )}
            {shipper.orders.data && shipper.orders.data.totalCount > 10 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={shipper.page === 1}
                        onClick={() => shipper.setPage(shipper.page - 1)}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span>
                        Trang {shipper.page} / {Math.ceil(shipper.orders.data.totalCount / 10)}
                    </span>
                    <button
                        type="button"
                        aria-label="Trang sau"
                        disabled={shipper.page * 10 >= shipper.orders.data.totalCount}
                        onClick={() => shipper.setPage(shipper.page + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
            <p className={styles.footerNote}>
                <ShieldCheck size={13} /> Mỗi kiện sách, một lần giao tận tâm.
            </p>
        </main>
    );
}
