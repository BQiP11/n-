import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TableOfContents from './pages/TableOfContents';
import AITutor from './pages/AITutor';
import Lesson from './pages/Lesson';
import AIHelper from './components/AIHelper';
import { Page, Chapter } from './types';
import { MenuIcon, XIcon } from './components/Icons';
import { NotificationProvider } from './contexts/NotificationContext';
import AchievementToast from './components/AchievementToast';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('table-of-contents');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState<string>('');

  const handleSetCurrentPage = useCallback((page: Page) => {
    setCurrentPage(page);
    setActiveChapter(null); // Return to TOC when switching main pages
    setIsSidebarOpen(false);
  }, []);
  
  const handleSelectChapter = (chapter: Chapter) => {
    setActiveChapter(chapter);
  }

  const handleExitLesson = () => {
    setActiveChapter(null);
  }
  
  const handleOpenAiHelper = (prompt?: string) => {
    if (prompt) {
        setContextualPrompt(prompt);
    }
    setIsAiHelperOpen(true);
  }
  
  const handleCloseAiHelper = () => {
    setIsAiHelperOpen(false);
    setContextualPrompt(''); // Clear prompt on close
  }

  const renderContent = () => {
    if (activeChapter) {
      return <Lesson chapter={activeChapter} onExit={handleExitLesson} openAiHelper={handleOpenAiHelper} />;
    }
    
    switch (currentPage) {
      case 'table-of-contents':
        return <TableOfContents onSelectChapter={handleSelectChapter} />;
      case 'ai-tutor':
        return <AITutor />;
      default:
        return <TableOfContents onSelectChapter={handleSelectChapter} />;
    }
  };

  return (
    <NotificationProvider>
        <div className="flex h-screen bg-transparent text-text-primary">
          <div className={`fixed inset-y-0 left-0 z-40 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
            <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} />
          </div>

          <main className="flex-1 flex flex-col overflow-hidden relative">
            <header className="flex md:hidden items-center justify-between p-4 bg-bg-synapse-medium/80 backdrop-blur-sm border-b border-border-color z-30">
                <h1 className="text-xl font-bold text-accent-magenta font-display">SYNAPSE N3</h1>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-text-secondary hover:text-accent-magenta">
                    {isSidebarOpen ? <XIcon /> : <MenuIcon />}
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </div>
            
            <AIHelper 
                isOpen={isAiHelperOpen}
                onOpen={() => handleOpenAiHelper()}
                onClose={handleCloseAiHelper}
                contextualPrompt={contextualPrompt}
            />
          </main>
        </div>
        <AchievementToast />
    </NotificationProvider>
  );
};

export default App;