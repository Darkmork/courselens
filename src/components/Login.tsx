import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ClassSphereLogo } from './ClassSphereLogo';

interface LoginProps {
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0a0a0a] overflow-hidden px-4 selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none" />
      
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group text-sm font-mono uppercase tracking-widest z-50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full"
      >
        <div className="relative group p-1 rounded-3xl bg-gradient-to-b from-white/10 to-white/0 shadow-2xl transition-all duration-500 hover:from-white/20">
          {/* Subtle glow border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/30 to-emerald-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          
          <div className="bg-[#111111]/80 backdrop-blur-2xl rounded-[1.4rem] p-10 text-center border border-white/5 space-y-10">
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                className="mx-auto flex items-center justify-center -mt-4 mb-2"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500/20 rounded-full blur-[40px] w-32 h-32" />
                <div className="relative">
                  <ClassSphereLogo size={120} />
                </div>
              </motion.div>

              <div className="space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 font-display"
                >
                  ClassSphere
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-neutral-400 font-mono text-sm max-w-[260px] mx-auto leading-relaxed"
                >
                  Inteligencia y gestión para profesores líderes.
                </motion.p>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button
                onClick={handleLogin}
                className="relative w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-[#111111]/80 backdrop-blur-md/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 font-semibold text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/5 to-emerald-500/0 -translate-x-[100%] group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 relative z-10 drop-shadow-md" alt="Google" />
                <span className="relative z-10 font-mono tracking-tight text-sm">Autenticar con Google</span>
              </button>
            </motion.div>
          </div>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 text-center mt-8 font-mono"
        >
          Acceso Restringido · Red Segura
        </motion.p>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Login;

