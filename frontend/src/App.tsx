import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import BookDetailPage from './pages/BookDetailPage';
import WishListPage from './pages/WishListPage';
import MyLibraryPage from './pages/MyLibraryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import RefundPage from './pages/RefundPage';
import AdminBookManagementPage from './pages/AdminBookManagementPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';

export const App: React.FC = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    {/* 1. Public Routes: Khách vãng lai và mọi người dùng đều truy cập được */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/books/:id" element={<BookDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* 2. Customer Routes: Dành cho độc giả (Member) hoặc tài khoản quản trị khi mua sắm */}
                    <Route element={<ProtectedRoute allowedRoles={['Member']} />}>
                        <Route path="/wishlist" element={<WishListPage />} />
                        <Route path="/my-library" element={<MyLibraryPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/refund" element={<RefundPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        
                    </Route>

                    {/* 3. Staff Routes: Quản lý sách, catalog và tài liệu */}
                    <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
                        <Route path="/admin/books" element={<AdminBookManagementPage />} />
                        <Route path="/staff/books" element={<AdminBookManagementPage />} />
                        
                    </Route>

                    {/* 4. Shipper Routes: Quản lý đơn hàng và giao nhận */}
                    <Route element={<ProtectedRoute allowedRoles={['Shipper']} />}>
                        
                    </Route>

                    {/* 5. Admin Only Routes: Chỉ Super Admin / Quản trị viên tối cao cấu hình hệ thống */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                        <Route path="/admin/settings" element={<AdminSettingsPage />} />
                        <Route path="/admin/reports" element={<AdminReportsPage />} />
                    </Route>
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;