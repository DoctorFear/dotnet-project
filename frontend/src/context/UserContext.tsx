/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { UserInfo } from '../types/user';

interface UserContextType {
    isLoggedIn: boolean;
    user: UserInfo | undefined;
    login: (userData: UserInfo) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Khởi tạo sẵn tài khoản đã đăng nhập đúng theo ảnh của bạn
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [user, setUser] = useState<UserInfo | undefined>({
        username: 'my_phedra',
        avatarUrl: 'https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ=',
    });

    const login = (userData: UserInfo) => {
        setIsLoggedIn(true);
        setUser(userData);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(undefined);
    };

    return (
        <UserContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser phải được sử dụng bên trong UserProvider');
    }
    return context;
};