
import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { PersonnelList } from './components/PersonnelList';
import { PersonnelDetail } from './components/PersonnelDetail';
import { ProcessSuite } from './components/ProcessSuite';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser: User | null) => {
      if (authUser) {
        const userRole = 'admin';

        setUser({
          name: authUser.displayName || 'Usuário',
          email: authUser.email,
          role: userRole
        });

        if (currentView === 'login') {
          setCurrentView('dashboard');
        }
      } else {
        setUser(null);
        setCurrentView('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentView]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('login');
      setSelectedSector(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const navigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleSelectSector = (sector: string) => {
    setSelectedSector(sector);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-500/20"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      currentView={currentView} 
      onLogout={handleLogout}
      navigate={navigate}
    >
      {currentView === 'login' && <Login />}
      {currentView === 'dashboard' && <Dashboard navigate={navigate} />}
      {currentView === 'personnel' && <PersonnelList navigate={navigate} onSelectSector={handleSelectSector} />}
      {currentView === 'personnel-detail' && selectedSector && <PersonnelDetail navigate={navigate} sector={selectedSector} user={user} />}
      {currentView === 'processes' && <ProcessSuite navigate={navigate} user={user} />}
    </Layout>
  );
};

export default App;
