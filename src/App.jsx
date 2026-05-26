import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import InstallPWA from '@/components/InstallPWA';
import Dashboard from '@/pages/Dashboard';
import Processes from '@/pages/Processes';
import ProcessDetail from '@/pages/ProcessDetail';
import Deadlines from '@/pages/Deadlines';
import Alerts from '@/pages/Alerts';
import Agenda from '@/pages/Agenda';
import Instalacao from '@/pages/Instalacao';
import KeywordRules from '@/pages/KeywordRules';
import Equipe from '@/pages/Equipe';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/processos" element={<Processes />} />
        <Route path="/processos/:id" element={<ProcessDetail />} />
        <Route path="/prazos" element={<Deadlines />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/instalar" element={<Instalacao />} />
        <Route path="/regras" element={<KeywordRules />} />
        <Route path="/equipe" element={<Equipe />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <InstallPWA />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
