import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Login from './components/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Sociogram from './pages/Sociogram';
import ImportSociogram from './pages/ImportSociogram';
import ImportForms from './pages/ImportForms';
import Conflicts from './pages/Conflicts';
import CourseLife from './pages/CourseLife';
import StudentLife from './pages/StudentLife';
import Spiritual from './pages/Spiritual';
import Projects from './pages/Projects';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

export type Page = 'dashboard' | 'students' | 'sociogram' | 'import-sociogram' | 'import-forms' | 'conflicts' | 'course-life' | 'student-life' | 'spiritual' | 'projects';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students onNavigate={setCurrentPage} />;
      case 'sociogram':
        return <Sociogram onNavigate={setCurrentPage} />;
      case 'import-sociogram':
        return <ImportSociogram onBack={() => setCurrentPage('sociogram')} />;
      case 'import-forms':
        return <ImportForms onNavigate={setCurrentPage} />;
      case 'conflicts':
        return <Conflicts />;
      case 'course-life':
        return <CourseLife onNavigate={setCurrentPage} />;
      case 'student-life':
        return <StudentLife onNavigate={setCurrentPage} />;
      case 'spiritual':
        return <Spiritual />;
      case 'projects':
        return <Projects />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <ProtectedRoute
        user={user}
        showLogin={showLogin}
        onLoginClick={() => setShowLogin(true)}
      >
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </Layout>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
