import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Milestone, MilestoneType } from '../types';
import { CalendarHeart, Plus, ImageIcon, Flag, Trophy, Target, PartyPopper } from 'lucide-react';

export default function CourseLife() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const courseId = 'course-1'; // Hardcoded for prototype

  useEffect(() => {
    // Note: ignoring index requirement for prototype initially by not ordering, or ordering simple.
    const q = query(collection(db, 'milestones')); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data: Milestone[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Milestone);
      });
      data = data.filter(m => !m.courseId || m.courseId === courseId);
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMilestones(data);
    }, (error) => {
      console.error('Milestones Error:', error);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'milestones'), {
        courseId,
        title: formData.get('title') as string,
        narrative: formData.get('narrative') as string,
        type: formData.get('type') as MilestoneType,
        date: formData.get('date') as string,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const getTypeIcon = (type: MilestoneType) => {
    switch(type) {
      case MilestoneType.ACHIEVEMENT: return <Trophy className="w-5 h-5 text-amber-500" />;
      case MilestoneType.CHALLENGE: return <Target className="w-5 h-5 text-red-500" />;
      case MilestoneType.CELEBRATION: return <PartyPopper className="w-5 h-5 text-purple-500" />;
      default: return <Flag className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarHeart className="w-8 h-8 text-rose-500" />
            Vida de Curso
          </h2>
          <p className="text-neutral-400">Línea de tiempo de hitos, vivencias y construcción de identidad.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Hito
        </button>
      </header>

      <div className="relative isolate">
        {/* Timeline Line */}
        <div className="absolute left-8 md:left-1/2 top-4 bottom-0 w-0.5 bg-white/5 -translate-x-1/2 -z-10" />

        <div className="space-y-8">
          {milestones.length === 0 && (
            <div className="py-20 text-center bg-[#111111]/50 rounded-3xl border-2 border-dashed border-white/10">
              <CalendarHeart className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-widest font-mono">Sin Hitos</h3>
              <p className="text-neutral-500">Construye la historia registrando el primer hito del curso.</p>
            </div>
          )}

          {milestones.map((milestone, idx) => (
            <div key={milestone.id} className={`flex flex-col md:flex-row items-start gap-6 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              {/* Timeline dot */}
              <div className="hidden md:flex flex-col items-center justify-start z-10 shrink-0 w-16">
                <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border-4 border-[#050505] flex items-center justify-center shadow-lg shadow-black/50">
                  {getTypeIcon(milestone.type)}
                </div>
              </div>

              {/* Content Card */}
              <div className={`w-full md:w-[calc(50%-2rem)] bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-md transition-shadow relative hover:border-white/20 group ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                {/* Mobile icon overlay */}
                <div className="md:hidden absolute -left-3 top-6 w-8 h-8 bg-[#1A1A1A] rounded-full border-2 border-[#050505] flex items-center justify-center shadow-sm">
                  {getTypeIcon(milestone.type)}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs md:hidden font-medium text-neutral-500">
                  <span className="bg-white/5 px-2 py-1 rounded-md">{milestone.type}</span>
                  <span>•</span>
                  <span>{milestone.date}</span>
                </div>
                
                <div className="hidden md:flex items-center gap-2 mb-3 text-xs font-medium text-neutral-500 justify-end font-mono" style={idx % 2 === 0 ? {justifyContent: 'flex-start'} : {}}>
                  <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{milestone.type}</span>
                  <span>•</span>
                  <span>{milestone.date}</span>
                </div>

                <h3 className="font-bold text-white text-xl mb-3 font-display group-hover:text-rose-400 transition-colors">{milestone.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {milestone.narrative}
                </p>

                {/* Optional Media Placeholder */}
                <div className="mt-4 h-32 bg-[#0A0A0A] rounded-xl border border-dashed border-white/10 flex items-center justify-center text-neutral-600">
                  <ImageIcon className="w-6 h-6 mr-2" /> <span className="text-xs font-medium uppercase tracking-wider font-mono">Sin imagen adjunta</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 font-display">Registrar Hito</h3>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Título</label>
                <input 
                  name="title"
                  type="text" 
                  required
                  placeholder="Ej. Aniversario del Colegio"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white placeholder:text-neutral-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Fecha</label>
                  <input 
                    name="date"
                    type="date" 
                    required
                    className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Tipo</label>
                  <select name="type" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white [&>option]:bg-[#111111]">
                    <option value={MilestoneType.ACTIVITY}>Actividad</option>
                    <option value={MilestoneType.ACHIEVEMENT}>Logro</option>
                    <option value={MilestoneType.CHALLENGE}>Desafío</option>
                    <option value={MilestoneType.CELEBRATION}>Celebración</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Narrativa</label>
                <textarea 
                  name="narrative"
                  required
                  placeholder="¿Cómo lo vivió el curso?..."
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none h-24 text-white placeholder:text-neutral-600"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-6 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
