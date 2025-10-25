
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TableOfContents from './pages/TableOfContents';
import AITutor from './pages/AITutor';
import Lesson from './pages/Lesson';
import Compendium from './pages/Compendium';
import PerformanceDashboard from './pages/PerformanceDashboard';
import AIHelper from './components/AIHelper';
import Quiz, { WrongAnswer } from './components/Quiz';
import { Page, Chapter, CustomQuiz } from './types';
import { MenuIcon, XIcon } from './components/Icons';
import { NotificationProvider } from './contexts/NotificationContext';
import AchievementToast from './components/AchievementToast';
import InitialAssessmentModal from './components/InitialAssessmentModal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('table-of-contents');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState<string>('');
  const [customQuiz, setCustomQuiz] = useState<CustomQuiz | null>(null);

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

  const handleStartCustomQuiz = (quiz: CustomQuiz) => {
    setCustomQuiz(quiz);
  }

  const handleCompleteCustomQuiz = (questionResults?: { itemId: string, correct: boolean }[]) => {
    setCustomQuiz(null);
  }

  const renderContent = () => {
    if (customQuiz) {
        return (
            <div className="max-w-3xl mx-auto">
                <Quiz
                    questions={customQuiz.questions}
                    title={customQuiz.title}
                    // FIX: Update onComplete handler to match the new signature which includes questionResults.
                    onComplete={(score: number, wrongAnswers: WrongAnswer[], questionResults: { itemId: string, correct: boolean }[]) => {
                        handleCompleteCustomQuiz(questionResults);
                    }}
                />
            </div>
        )
    }

    if (activeChapter) {
      return <Lesson chapter={activeChapter} onExit={handleExitLesson} openAiHelper={handleOpenAiHelper} onStartCustomQuiz={handleStartCustomQuiz} />;
    }
    
    switch (currentPage) {
      case 'table-of-contents':
        return <TableOfContents onSelectChapter={handleSelectChapter} onStartCustomQuiz={handleStartCustomQuiz} />;
      case 'ai-tutor':
        return <AITutor />;
      case 'compendium':
        // FIX: Add onStartCustomQuiz prop to satisfy the component's expected props, resolving the type error.
        return <Compendium openAiHelper={handleOpenAiHelper} onStartCustomQuiz={handleStartCustomQuiz} />;
      case 'performance-dashboard':
        return <PerformanceDashboard />;
      default:
        return <TableOfContents onSelectChapter={handleSelectChapter} onStartCustomQuiz={handleStartCustomQuiz} />;
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
        <InitialAssessmentModal />
    </NotificationProvider>
  );
};

export default App;