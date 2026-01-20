import React from 'react';
import { ViewState, UserProfile } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  currentView: ViewState;
  onLogout: () => void;
  navigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onLogout, navigate }) => {
  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <div className="flex-grow flex items-center justify-center p-4">
          {children}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-suga-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('dashboard')}>
          <div className="bg-suga-dark text-white font-bold p-1 rounded px-2 text-sm">SUGA</div>
          <div className="flex items-center text-suga-dark font-bold text-sm tracking-wide">
            SISTEMA UNIFICADO DE GESTÃO ADMINISTRATIVA
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-500">OLÁ, <span className="text-green-600 font-bold">ADMINISTRADOR</span></div>
            <div className="text-[10px] text-gray-400 font-medium">{user?.email || 'ADMIN'}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <button 
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded transition-colors"
          >
            SAIR
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-white py-4 px-6 border-t border-gray-100 mt-auto">
    <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
          Desenvolvido por <span className="text-suga-dark">Jairton Filho</span> © 2025
        </span>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span className="text-[10px] font-bold">JAIRTONTECH</span>
      </div>
    </div>
  </footer>
);