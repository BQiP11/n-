import React from 'react';
import type { Page } from '../types';
import { DashboardIcon, ChatBubbleIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'table-of-contents', label: 'Mục lục', icon: <DashboardIcon /> },
    { id: 'ai-tutor', label: 'Trợ giảng AI', icon: <ChatBubbleIcon /> },
  ];

  return (
    <aside className="glass-card h-full flex flex-col border-r border-border-color">
      <div className="p-6 border-b border-border-color">
        <h1 className="text-2xl font-bold text-accent-magenta font-display tracking-wider">SYNAPSE N3</h1>
        <p className="text-sm text-text-secondary mt-1">Giao thức học tập</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id as Page)}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 group relative ${
              currentPage === item.id
                ? 'bg-accent-magenta/10 text-accent-magenta font-semibold'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            {currentPage === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-accent-magenta rounded-r-full" style={{boxShadow: 'var(--accent-glow)'}}></div>}
            <span className={`mr-4 transition-all duration-200 ${currentPage === item.id ? 'text-accent-magenta' : 'text-text-secondary group-hover:text-accent-magenta'}`}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border-color">
        <p className="text-xs text-center text-text-secondary/50">
          Hỗ trợ bởi Gemini AI
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
