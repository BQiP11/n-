import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Helper function to render text with furigana
export const renderWithFurigana = (textWithFurigana: string) => {
    const parts = textWithFurigana.split(/(\[.*?\]\{.*?\})/g).filter(Boolean);
    return (
      <>
        {parts.map((part, index) => {
          const match = part.match(/\[(.*?)\]\{(.*?)\}/);
          if (match) {
            const [, kanji, furigana] = match;
            return (
              // FIX: Replaced the <rb> tag with direct rendering of the base text within the <ruby> element to fix JSX typing errors.
              <ruby key={index} className="font-jp">
                {kanji}
                <rt>{furigana}</rt>
              </ruby>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-border-color sticky top-0 bg-bg-synapse-medium/80 backdrop-blur-sm rounded-t-2xl z-10">
          <h2 id="modal-title" className="text-xl font-bold text-accent-magenta font-display">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-white/10 hover:text-accent-magenta transition-colors"
            aria-label="Close modal"
          >
            <XIcon />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;