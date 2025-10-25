import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { CheckCircleIcon } from './Icons';

const AchievementToast: React.FC = () => {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-5 right-5 z-[100] space-y-3">
            {notifications.map((notif) => (
                <ToastItem key={notif.timestamp} notification={notif} onRemove={removeNotification} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    notification: {
        timestamp: number;
        name: string;
        description: string;
    };
    onRemove: (timestamp: number) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(notification.timestamp);
        }, 5000); // Auto-dismiss after 5 seconds
        return () => clearTimeout(timer);
    }, [notification, onRemove]);

    return (
        <div 
          className="glass-card flex items-start p-4 rounded-xl shadow-lg border-l-4 border-yellow-400 max-w-sm animate-fade-in"
          style={{animationName: 'slideInRight'}}
        >
            <div className="flex-shrink-0 text-yellow-300">
                <CheckCircleIcon className="w-7 h-7" />
            </div>
            <div className="ml-3 flex-1">
                <p className="text-base font-bold text-yellow-300">Đã mở khóa thành tựu!</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{notification.name}</p>
                <p className="text-xs text-text-secondary">{notification.description}</p>
            </div>
             <button onClick={() => onRemove(notification.timestamp)} className="ml-4 flex-shrink-0 text-text-secondary hover:text-white">&times;</button>
             <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
             `}</style>
        </div>
    );
};


export default AchievementToast;
