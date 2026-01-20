import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { PersonnelList } from './components/PersonnelList';
import { ProcessSuite } from './components/ProcessSuite';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser: User | null) => {
      if (authUser) {
        // Regra alterada: Todos os usuários recebem nível de admin
        const userRole = 'admin';

        /* 
        // Lógica anterior desativada para forçar admin para todos
        try {
          if (authUser.email) {
            const userDocRef = doc(db, 'users', authUser.email);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              // userRole = userSnap.data().role;
            }
          }
        } catch (error) {
          console.error("Erro ao buscar permissões:", error);
        }
        */

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
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const navigate = (view: ViewState) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-suga-light flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-suga-dark rounded-lg mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
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
      {currentView === 'personnel' && <PersonnelList navigate={navigate} />}
      {currentView === 'processes' && <ProcessSuite navigate={navigate} user={user} />}
    </Layout>
  );
};

export default App;