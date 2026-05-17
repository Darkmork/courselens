import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Users, HeartPulse, ShieldAlert, ArrowRight, Activity, Zap } from 'lucide-react';

import { ClassSphereLogo } from '../components/ClassSphereLogo';

interface LandingProps {
  onLoginClick: () => void;
}

export default function Landing({ onLoginClick }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Global Background Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay z-0" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-4">
          <ClassSphereLogo size={64} />
          <span className="text-3xl font-bold tracking-tight text-white font-display">
            ClassSphere
          </span>
        </div>
        <button 
          onClick={onLoginClick}
          className="group relative px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 font-mono text-sm text-white overflow-hidden uppercase tracking-widest"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/5 to-emerald-500/0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]" />
          Acceder al Sistema
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 pt-20 pb-32 max-w-7xl mx-auto border-x border-white/5 border-dashed">
        <div className="max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs uppercase tracking-widest mb-8"
          >
            <Activity className="w-3 h-3" />
            Ecosistema Educativo de Próxima Generación
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30 font-display mb-8 leading-[1.1]"
          >
            Inteligencia <br className="hidden md:block"/>
            <span className="italic font-light text-neutral-500">sobre</span> Intuición.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 max-w-2xl font-light leading-relaxed mb-12"
          >
            ClassSphere no es una plataforma de gestión escolar más. Es un ente analítico diseñado para que los Profesores Jefe mapeen las relaciones invisibles de su curso, detecten fricciones antes de que se conviertan en incidentes y construyan una cultura de grupo basada en datos.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={onLoginClick}
              className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] font-display uppercase tracking-widest text-sm"
            >
              Iniciar Despliegue <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#vision"
              className="px-8 py-4 bg-[#111] border border-white/10 hover:border-white/20 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all font-display uppercase tracking-widest text-sm"
            >
              Conoce la Verdad
            </a>
          </motion.div>
        </div>

        {/* Feature Grid - The Vision */}
        <div id="vision" className="mt-40 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full mb-10">
            <h2 className="text-3xl font-bold font-display text-white border-b border-white/10 pb-4 inline-block pr-10">La Anatomía del Sistema</h2>
          </div>

          {[
            {
              icon: BrainCircuit,
              title: "Grafo Social Predictivo",
              desc: "Procesamos las interacciones de los alumnos para mapear redes de confianza, identificando líderes en la sombra y nodos aislados en tiempo real.",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20"
            },
            {
              icon: ShieldAlert,
              title: "Detección Temprana de Fricción",
              desc: "Modelos de riesgo que escalan advertencias cuando los patrones de convivencia o rendimiento se desvían de la norma fundamental del curso.",
              color: "text-red-400",
              bg: "bg-red-500/10",
              border: "border-red-500/20"
            },
            {
              icon: HeartPulse,
              title: "Ecosistema Emocional",
              desc: "El rendimiento académico es un síntoma. Registramos y correlacionamos la vida espiritual y emocional para un diagnóstico causal real.",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20"
            }
          ].map((feature, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              key={idx}
              className="bg-[#111]/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-1 transition-all ${feature.bg} ${feature.border} border`}>
                <feature.icon className={`w-7 h-7 drop-shadow-lg ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-display">{feature.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}

          {/* Large Bento Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#111] to-black p-8 md:p-12 rounded-[3rem] border border-white/5 relative overflow-hidden mt-6"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl">
              <span className="font-mono text-purple-400 text-xs uppercase tracking-widest mb-4 inline-block pl-1">Manifiesto // Proyección</span>
              <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                No administres un curso. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Desarrolla una civilización.</span>
              </h3>
              <p className="text-neutral-400 text-lg md:text-xl font-light mb-8 leading-relaxed">
                El valor de ClassSphere radica en elevar la figura del Profesor Jefe de un mero administrador disciplinario a un ingeniero social guiado por métricas. Construye la moral, el alma y el destino de tu curso con herramientas que ven mucho más allá de las calificaciones.
              </p>
              
              <button 
                onClick={onLoginClick}
                className="group flex items-center gap-3 text-white font-mono uppercase tracking-widest font-bold text-sm bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 transition-all w-fit"
              >
                <Zap className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                Desbloquear el Sistema Completo
              </button>
            </div>
          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 border-dashed relative z-10 px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white font-display">ClassSphere</span>
            <span className="text-neutral-600 font-mono text-xs ml-2">v1.0.0-beta</span>
          </div>
          <div className="flex gap-6 text-sm font-mono text-neutral-500 uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors">Sistema</span>
            <span className="hover:text-white cursor-pointer transition-colors">Doctrina</span>
            <span className="hover:text-white cursor-pointer transition-colors">Acerca De</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
