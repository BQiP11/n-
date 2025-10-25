import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="p-6 glass-card border border-red-500/50 rounded-xl text-center shadow-lg">
    <h3 className="text-xl font-bold text-red-400">Đã xảy ra lỗi</h3>
    <p className="text-red-300 my-3">{message}</p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-bg-synapse-deep"
    >
      Thử lại
    </button>
  </div>
);

export default ErrorMessage;
