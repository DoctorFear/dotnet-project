import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { adminUserService } from '../services/adminUserService';
import type { ToastMessage } from '../components/common/ToastNotification';
import type {
    CreateInternalUserRequest,
    CreateUserFormErrors,
    InternalUserRole,
    UserManagementItem,
    UserRoleType,
} from '../types/adminUser';

const PAGE_SIZE = 8;
const VN_PHONE_REGEX = /^0(3[2-9]|5[689]|7[06-9]|8[1-6|8|9]|9[0-46-9])[0-9]{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INTERNAL_ROLES: InternalUserRole[] = ['Admin', 'Staff', 'Shipper'];

export const ROLE_META: Record<
    UserRoleType,
    { label: string; optionDesc: string }
> = {
    Admin: {
        label: 'Quản trị viên',
        optionDesc: 'Toàn quyền cấu hình, vận hành và phân quyền nhân sự.',
    },
    Staff: {
        label: 'Nhân viên hệ thống',
        optionDesc: 'Quản lý kho sách, tiếp nhận đơn và tư vấn Live Chat.',
    },
    Shipper: {
        label: 'Nhân viên giao hàng',
        optionDesc: 'Nhận vận đơn giao hàng và đối soát tiền thu hộ COD.',
    },
    Member: {
        label: 'Khách hàng thành viên',
        optionDesc: 'Tài khoản mua sách (Storefront).',
    },
};

export const useAdminUserManagement = () => {
    const { user: currentAuthUser } = useUser();

    // Table & filter state
    const [users, setUsers] = useState<UserManagementItem[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [searchText, setSearchText] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<UserRoleType | ''>('');
    const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'locked'>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Toast notifications
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, message, type }]);
    }, []);
    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [createForm, setCreateForm] = useState<CreateInternalUserRequest>({
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        role: 'Staff',
    });
    const [createErrors, setCreateErrors] = useState<CreateUserFormErrors>({});

    const [roleTargetUser, setRoleTargetUser] = useState<UserManagementItem | null>(null);
    const [selectedRole, setSelectedRole] = useState<InternalUserRole>('Staff');
    const [roleWarn, setRoleWarn] = useState<string>('');

    const [statusTargetUser, setStatusTargetUser] = useState<UserManagementItem | null>(null);
    const [statusWarn, setStatusWarn] = useState<string>('');

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const isActiveParam =
                statusFilter === '' ? undefined : statusFilter === 'active';
            const res = await adminUserService.getUsers({
                keyword: searchText,
                role: roleFilter,
                isActive: isActiveParam,
                pageNumber: currentPage,
                pageSize,
            });

            if (!res.success || !res.data) {
                setError(res.message || 'Không thể tải danh sách người dùng.');
                return;
            }

            setUsers(res.data.items);
            setTotalCount(res.data.totalCount);
            setTotalPages(Math.max(1, res.data.totalPages));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, roleFilter, searchText, statusFilter]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadUsers();
        }, 200);
        return () => window.clearTimeout(timer);
    }, [loadUsers]);

    const currentUserId = Number(currentAuthUser?.id ?? 0);
    const currentUserIsSuperAdmin = useMemo(() => {
        const selfRecord = users.find((u) => u.id === currentUserId);
        return Boolean(
            selfRecord?.isSuperAdmin ||
                (currentAuthUser as { isSuperAdmin?: boolean })?.isSuperAdmin
        );
    }, [currentAuthUser, currentUserId, users]);

    const getRowPermissions = useCallback(
        (target: UserManagementItem) => {
            const isSelf = target.id === currentUserId;
            const isSuper = target.isSuperAdmin;
            const isMember = target.role === 'Member';

            let editDisabled = false;
            let editTitle = 'Phân lại vai trò nội bộ';

            if (isMember) {
                editDisabled = true;
                editTitle = 'Tài khoản Khách hàng (Member) thuộc Storefront, không thể gán quyền nội bộ';
            } else if (isSuper) {
                editDisabled = true;
                editTitle = 'Tài khoản Super Admin bất khả xâm phạm';
            } else if (isSelf) {
                editDisabled = true;
                editTitle = 'Không thể tự đổi vai trò của chính mình';
            } else if (target.role === 'Admin' && !currentUserIsSuperAdmin) {
                editDisabled = true;
                editTitle = 'Chỉ Super Admin mới có quyền đổi vai trò của Quản trị viên khác';
            }

            const lockDisabled = isSuper || isSelf;
            const lockTitle = isSuper
                ? 'Không thể khóa Super Admin'
                : isSelf
                  ? 'Không thể tự khóa tài khoản của chính mình'
                  : '';

            return { isSelf, isSuper, editDisabled, editTitle, lockDisabled, lockTitle };
        },
        [currentUserId, currentUserIsSuperAdmin]
    );

    // --- Create Internal User Handlers ---
    const openCreateModal = () => {
        setCreateForm({
            username: '',
            email: '',
            fullName: '',
            phoneNumber: '',
            role: 'Staff',
        });
        setCreateErrors({});
        setIsCreateOpen(true);
    };

    const closeCreateModal = () => {
        if (!isSubmitting) setIsCreateOpen(false);
    };

    const updateCreateField = <K extends keyof CreateInternalUserRequest>(
        key: K,
        value: CreateInternalUserRequest[K]
    ) => {
        setCreateForm((prev) => ({ ...prev, [key]: value }));
        setCreateErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const submitCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: CreateUserFormErrors = {};
        const username = createForm.username.trim();
        const email = createForm.email.trim();
        const fullName = createForm.fullName.trim();
        const phoneNumber = createForm.phoneNumber.trim();

        if (!username) errors.username = 'Vui lòng nhập tên đăng nhập.';
        else if (/\s/.test(username)) errors.username = 'Tên đăng nhập không được chứa khoảng trắng.';

        if (!email) errors.email = 'Vui lòng nhập địa chỉ email.';
        else if (!EMAIL_REGEX.test(email)) errors.email = 'Email không đúng định dạng thư điện tử chuẩn.';

        if (!fullName) errors.fullName = 'Vui lòng nhập họ và tên.';

        if (!phoneNumber) errors.phoneNumber = 'Vui lòng nhập số điện thoại.';
        else if (!VN_PHONE_REGEX.test(phoneNumber)) {
            errors.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số (đầu số 03, 05, 07, 08, 09).';
        }

        if (!INTERNAL_ROLES.includes(createForm.role)) {
            errors.role = 'Vui lòng chọn vai trò nội bộ hợp lệ.';
        }

        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await adminUserService.createInternalUser({
                username,
                email,
                fullName,
                phoneNumber,
                role: createForm.role,
            });

            if (!res.success) {
                addToast(res.message || 'Không thể tạo tài khoản nhân sự.', 'error');
                return;
            }

            setIsCreateOpen(false);
            setCurrentPage(1);
            await loadUsers();
            addToast(
                res.message || `Đã tạo thành công tài khoản @${username} (${ROLE_META[createForm.role].label})`,
                'success'
            );
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Không thể tạo tài khoản nhân sự.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Assign Internal Role Handlers ---
    const openRoleModal = (target: UserManagementItem) => {
        if (target.role === 'Member') {
            addToast('Tài khoản Member là khách hàng Storefront, không thể phân quyền nội bộ!', 'error');
            return;
        }
        setRoleTargetUser(target);
        setSelectedRole(target.role as InternalUserRole);
        setRoleWarn('');
    };

    const closeRoleModal = () => {
        if (!isSubmitting) {
            setRoleTargetUser(null);
            setRoleWarn('');
        }
    };

    const submitRoleChange = async () => {
        if (!roleTargetUser) return;
        if (!INTERNAL_ROLES.includes(selectedRole)) {
            setRoleWarn('Mỗi nhân sự bắt buộc phải chọn 1 vai trò nội bộ.');
            return;
        }

        setIsSubmitting(true);
        setRoleWarn('');
        try {
            const res = await adminUserService.updateRole(roleTargetUser.id, {
                newRole: selectedRole,
            });

            if (!res.success) {
                setRoleWarn(res.message || 'Không thể cập nhật vai trò.');
                return;
            }

            const username = roleTargetUser.username;
            setRoleTargetUser(null);
            await loadUsers();
            addToast(
                res.message || `Đã chuyển @${username} sang vai trò: ${ROLE_META[selectedRole].label}`,
                'success'
            );
        } catch (err) {
            setRoleWarn(err instanceof Error ? err.message : 'Không thể cập nhật vai trò.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Lock / Unlock Status Handlers ---
    const openStatusModal = (target: UserManagementItem) => {
        if (target.isSuperAdmin || target.id === currentUserId) return;
        setStatusTargetUser(target);
        setStatusWarn('');
    };

    const closeStatusModal = () => {
        if (!isSubmitting) {
            setStatusTargetUser(null);
            setStatusWarn('');
        }
    };

    const submitStatusToggle = async () => {
        if (!statusTargetUser) return;
        const nextIsActive = !statusTargetUser.isActive;

        setIsSubmitting(true);
        setStatusWarn('');
        try {
            const res = await adminUserService.toggleStatus(statusTargetUser.id, {
                isActive: nextIsActive,
            });

            if (!res.success) {
                setStatusWarn(res.message || 'Không thể cập nhật trạng thái tài khoản.');
                return;
            }

            const username = statusTargetUser.username;
            setStatusTargetUser(null);
            await loadUsers();
            addToast(
                res.message ||
                    (nextIsActive
                        ? `Đã mở khóa tài khoản @${username}!`
                        : `Đã khóa tài khoản @${username}!`),
                'success'
            );
        } catch (err) {
            setStatusWarn(
                err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tài khoản.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        users,
        totalCount,
        totalPages,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize,
        searchText,
        roleFilter,
        statusFilter,
        isLoading,
        error,
        isSubmitting,
        toasts,
        removeToast,
        setSearchText: (val: string) => {
            setSearchText(val);
            setCurrentPage(1);
        },
        setRoleFilter: (val: UserRoleType | '') => {
            setRoleFilter(val);
            setCurrentPage(1);
        },
        setStatusFilter: (val: '' | 'active' | 'locked') => {
            setStatusFilter(val);
            setCurrentPage(1);
        },
        getRowPermissions,
        isCreateOpen,
        createForm,
        createErrors,
        openCreateModal,
        closeCreateModal,
        updateCreateField,
        submitCreateUser,
        roleTargetUser,
        selectedRole,
        roleWarn,
        setSelectedRole,
        openRoleModal,
        closeRoleModal,
        submitRoleChange,
        statusTargetUser,
        statusWarn,
        openStatusModal,
        closeStatusModal,
        submitStatusToggle,
    };
};