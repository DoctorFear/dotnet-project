/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { UserInfo, LoginResponseDto } from '../types/user';

interface UserContextType {
    isLoggedIn: boolean;
    user: UserInfo | undefined;
    loginSuccess: (authData: LoginResponseDto) => void;
    logoutClient: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | undefined>(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                return JSON.parse(savedUser) as UserInfo;
            } catch {
                return undefined;
            }
        }
        return undefined;
    });

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return !!localStorage.getItem('accessToken');
    });

    const loginSuccess = (authData: LoginResponseDto) => {
        const userInfo: UserInfo = {
            id: authData.userId,
            username: authData.username,
            email: authData.email,
            fullName: authData.fullName,
            role: authData.role,
            fPoints: authData.fPoints,  
            avatarUrl: 'https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ='
        };

        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(userInfo));

        setUser(userInfo);
        setIsLoggedIn(true);
    };

    const logoutClient = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        setUser(undefined);
        setIsLoggedIn(false);
    };

    return (
        <UserContext.Provider value={{ isLoggedIn, user, loginSuccess, logoutClient }}>
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