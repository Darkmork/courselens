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
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Global Background Effects inside Layout */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Mobile Header */}
      <div className="md:hidden bg-[#0A0A0A] border-b border-white/5 px-4 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <ClassSphereLogo size={48} />
          <h1 className="text-xl font-bold text-white font-display tracking-tight">ClassSphere</h1>
        </div>
        <button className="text-neutral-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A]/80 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden md:flex items-center gap-3 mb-12">
            <ClassSphereLogo size={56} />
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">ClassSphere</h1>
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
                      ? 'text-white' 
                      : 'text-neutral-400 hover:text-white'}
                  `}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-[#111111]/80 backdrop-blur-md/5 border border-white/10 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-md shadow-[0_0_10px_#3b82f6]" />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-neutral-200'}`} />
                  <span className="relative z-10 tracking-wide text-sm">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 flex flex-col gap-4 mt-auto">
            <div className="bg-[#111] border border-white/5 p-3 rounded-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center shadow-inner">
                <span className="text-neutral-300 text-sm font-bold font-mono">
                  {auth.currentUser?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate font-display">
                  {auth.currentUser?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mt-0.5">Admin</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-medium text-sm"
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
