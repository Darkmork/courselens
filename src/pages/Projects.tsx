import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, ProjectStatus } from '../types';
import { KanbanSquare, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const courseId = 'course-1'; // Hardcoded for prototype

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const data: Project[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Project);
      });
      // Filter by course
      setProjects(data.filter(p => !p.courseId || p.courseId === courseId));
    }, (error) => {
      console.error('Projects Error:', error);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'projects'), {
        courseId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        status: ProjectStatus.PLANNING,
        progress: 0,
        dueDate: formData.get('dueDate') as string || null,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-blue-600" />
            Proyectos de Curso
          </h2>
          <p className="text-neutral-400">Gestión de proyectos, directiva y actividades grupales.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-[#111111]/50 rounded-3xl border-2 border-dashed border-white/10">
            <KanbanSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-widest font-mono">Sin Proyectos</h3>
            <p className="text-neutral-500">No hay proyectos activos. Comienza creando uno.</p>
          </div>
        )}
        
        {projects.map(project => (
          <div key={project.id} className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-md hover:border-white/20 transition-all flex flex-col group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-bold text-white text-lg font-display group-hover:text-blue-400 transition-colors">{project.name}</h3>
              <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border tracking-widest ${
                project.status === ProjectStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                project.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-neutral-400 border-white/10'
              }`}>
                {project.status}
              </span>
            </div>
            
            <p className="text-sm text-neutral-400 mb-6 flex-1 line-clamp-3 leading-relaxed relative z-10">
              {project.description}
            </p>
            
            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider">Progreso</span>
                  <span className="font-mono font-bold text-white">{project.progress}%</span>
                </div>
                <div className="w-full bg-[#1A1A1A] border border-[#050505] h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] ${project.progress === 100 ? 'bg-emerald-500 text-emerald-500' : 'bg-blue-500 text-blue-500'}`} 
                    style={{ width: `${project.progress}%` }} 
                  />
                </div>
              </div>
              
              {project.dueDate && (
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono uppercase tracking-widest bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                  Fecha límite: {project.dueDate}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 font-display">Nuevo Proyecto</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Nombre del Proyecto</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  placeholder="Ej. Feria Científica"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Descripción</label>
                <textarea 
                  name="description"
                  required
                  placeholder="Detalles y objetivos del proyecto..."
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24 text-white placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Fecha Límite (Opcional)</label>
                <input 
                  name="dueDate"
                  type="date" 
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5 font-mono uppercase tracking-widest text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] font-mono uppercase tracking-widest text-sm"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
