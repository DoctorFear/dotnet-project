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
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailsPage';
import AdminOrderManagementPage from './pages/AdminOrderManagementPage';
import { SePayPaymentPage } from './pages/SePaymentPage';
import ShipperPortalPage from './pages/ShipperPortalPage';
import FulfillmentPage from './pages/FulfillmentPage';
import LoyaltyPage from './pages/LoyaltyPage';
import MemberReviewsPage from './pages/MemberReviewsPage';
import MembershipConfigPage from './pages/MembershipConfigPage';
import AdminRefundManagementPage from './pages/AdminRefundManagmentPage';
const WorkflowPreviewPage = import.meta.env.DEV ? React.lazy(() => import('./dev/WorkflowPreviewPage')) : null;

export const App: React.FC = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    {WorkflowPreviewPage && (
                        <Route path="/preview/huy/:screen?" element={
                            <React.Suspense fallback={<p>Đang mở giao diện...</p>}>
                                <WorkflowPreviewPage />
                            </React.Suspense>
                        } />
                    )}
                    {/* 1. Public Routes: Khách vãng lai và mọi người dùng đều truy cập được */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/books/:id" element={<BookDetailPage />} />
                    <Route path="/login" element={<LoginPage />} /> {/* Sơn */}
                    <Route path="/register" element={<RegisterPage />} /> {/* Sơn */}
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* Sơn */}
                    <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Sơn */}

                    {/* 2. Customer Routes: Dành cho độc giả (Member) hoặc tài khoản quản trị khi mua sắm */}
                    <Route element={<ProtectedRoute allowedRoles={['Member']} />}>
                        <Route path="/wishlist" element={<WishListPage />} />
                        <Route path="/my-library" element={<MyLibraryPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/sepay-payment" element={<SePayPaymentPage />} />
                        <Route path="/refund/:orderId" element={<RefundPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/order-history" element={<OrderHistoryPage />} />
                        <Route path="/order-history/:id" element={<OrderDetailPage />} />
                        <Route path="/f-point" element={<LoyaltyPage />} />
                        <Route path="/membership" element={<LoyaltyPage membership />} />
                        <Route path="/my-reviews" element={<MemberReviewsPage />} />
                        
                    </Route>

                    {/* 3. Staff Routes: Quản lý sách, catalog và tài liệu */}
                    <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
                        <Route path="/admin/books" element={<AdminBookManagementPage />} />
                        <Route path="/staff/books" element={<AdminBookManagementPage />} />
                        <Route path="/admin/orders" element={<AdminOrderManagementPage />} />
                        <Route path="/staff/orders" element={<AdminOrderManagementPage />} />
                        <Route path="/admin/refunds" element={<AdminRefundManagementPage />} />
                        <Route path="/staff/refunds" element={<AdminRefundManagementPage />} />
                        <Route path="/staff/packing" element={<FulfillmentPage />} />
                    </Route>

                    {/* 4. Shipper Routes: Quản lý đơn hàng và giao nhận */}
                    <Route element={<ProtectedRoute allowedRoles={['Shipper']} />}>
                        <Route path="/shipper/orders" element={<ShipperPortalPage />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['Staff', 'Admin']} />}>
                        <Route path="/admin/membership-tiers" element={<MembershipConfigPage />} />
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
