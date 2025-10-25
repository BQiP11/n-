import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'AI đang tạo nội dung...' }) => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-magenta)] mb-4"></div>
    <p className="text-lg font-semibold text-[var(--accent-magenta)]">{message}</p>
    <p className="text-text-secondary mt-1">Vui lòng chờ trong giây lát.</p>
  </div>
);

export default LoadingSpinner;
