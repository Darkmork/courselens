import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Share2, 
  AlertCircle, 
  LogOut,
  Menu,
  X,
  CalendarHeart,
  Sparkles,
  KanbanSquare
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import type { Page } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { ClassSphereLogo } from './ClassSphereLogo';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard' as Page, label: 'Panel General', icon: LayoutDashboard },
    { id: 'students' as Page, label: 'Alumnos', icon: Users },
    { id: 'sociogram' as Page, label: 'Sociograma', icon: Share2 },
    { id: 'conflicts' as Page, label: 'Convivencia', icon: AlertCircle },
    { id: 'course-life' as Page, label: 'Hitos', icon: CalendarHeart },
    { id: 'spiritual' as Page, label: 'Orientación', icon: Sparkles },
    { id: 'projects' as Page, label: 'Proyectos', icon: KanbanSquare },
  ];

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-800 flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <ClassSphereLogo size={48} />
          <h1 className="text-xl font-bold text-primary font-display tracking-tight">ClassSphere</h1>
        </div>
        <button className="text-gray-500 hover:text-gray-900 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-white backdrop-blur-2xl border-r border-gray-200 shadow-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden md:flex items-center gap-3 mb-12">
            <ClassSphereLogo size={56} />
            <h1 className="text-2xl font-bold tracking-tight text-primary font-display">ClassSphere</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium group relative overflow-hidden
                    ${isActive
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-primary-50 border border-primary-100 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-gray-700'}`} />
                  <span className="relative z-10 tracking-wide text-sm">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-gray-200 flex flex-col gap-4 mt-auto">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold font-mono">
                  {auth.currentUser?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate font-display">
                  {auth.currentUser?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-primary font-mono uppercase tracking-widest mt-0.5">Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-auto h-[100dvh]">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8 pb-32">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
