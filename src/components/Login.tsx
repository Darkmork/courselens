import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-white to-gray-100 overflow-hidden px-4 selection:bg-blue-500/30">

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors group text-sm font-mono uppercase tracking-widest z-50"
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
        <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-lg space-y-10">
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              className="mx-auto flex items-center justify-center -mt-4 mb-2"
            >
              <div className="relative">
                <ClassSphereLogo size={120} />
              </div>
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl font-extrabold tracking-tighter text-primary text-center font-display"
              >
                ClassSphere
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-500 font-mono text-sm max-w-[260px] mx-auto leading-relaxed"
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
              className="relative w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl transition-all duration-300 font-semibold overflow-hidden shadow-md hover:shadow-lg"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 relative z-10 drop-shadow-md" alt="Google" />
              <span className="relative z-10 font-mono tracking-tight text-sm">Autenticar con Google</span>
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-[10px] uppercase tracking-[0.2em] text-gray-400 text-center mt-8 font-mono"
        >
          Acceso Restringido · Red Segura
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
