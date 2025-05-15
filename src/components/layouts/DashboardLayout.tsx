import React, { ReactNode } from 'react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // If not authenticated, redirect to login
  if (!isLoading && !user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
