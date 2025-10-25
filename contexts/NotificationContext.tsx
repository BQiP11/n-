import React, { createContext, useState, useCallback, useContext } from 'react';
import type { Achievement } from '../types';

interface Notification extends Achievement {
    timestamp: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (achievement: Achievement) => void;
    removeNotification: (timestamp: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((achievement: Achievement) => {
        const newNotification = { ...achievement, timestamp: Date.now() };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const removeNotification = useCallback((timestamp: number) => {
        setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
