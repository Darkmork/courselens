import React from 'react';
import { User } from 'firebase/auth';
import Landing from '../pages/Landing';
import Login from '../components/Login';

interface ProtectedRouteProps {
  user: User | null;
  showLogin: boolean;
  onLoginClick: () => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  showLogin,
  onLoginClick,
  children,
}) => {
  if (!user) {
    if (showLogin) {
      return <Login onBack={onLoginClick} />;
    }
    return <Landing onLoginClick={onLoginClick} />;
  }

  return <>{children}</>;
};