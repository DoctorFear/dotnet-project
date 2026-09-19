import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/BookDetailPage';
import WishListPage from './pages/WishListPage';
import MyLibraryPage from './pages/MyLibraryPage';

export const App: React.FC = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    {/* Trang chủ Storefront */}
                    <Route path="/" element={<HomePage />} />

                    {/* Trang chi tiết sách */}
                    <Route path="/books/:id" element={<BookDetailPage />} />

                    {/* Trang sách yêu thích */}
                    <Route path="/wishlist" element={<WishListPage />} />

                    {/* Trang tủ sách cá nhân*/}
                    <Route path="/my-library" element={<MyLibraryPage />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
