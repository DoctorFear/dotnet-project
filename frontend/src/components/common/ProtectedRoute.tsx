import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isLoggedIn, user } = useUser();

    // 1. Chưa đăng nhập -> Chuyển hướng về trang Login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng không đủ quyền truy cập (vd: Member vào trang Admin)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // 3. Hợp lệ -> Render tiếp nội dung của Route con
    return <Outlet />;
};

export default ProtectedRoute;