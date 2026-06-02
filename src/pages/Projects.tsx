import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_COURSE_ID } from '../lib/constants';
import { Project, ProjectStatus } from '../types';
import { KanbanSquare, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const courseId = DEFAULT_COURSE_ID;

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-blue-500" />
            Proyectos de Curso
          </h2>
          <p className="text-gray-500">Gestion de proyectos, directiva y actividades grupales.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold shadow-sm hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
            <KanbanSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest font-mono">Sin Proyectos</h3>
            <p className="text-gray-500">No hay proyectos activos. Comienza creando uno.</p>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-bold text-gray-900 text-lg font-display group-hover:text-blue-600 transition-colors">{project.name}</h3>
              <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border tracking-widest ${
                project.status === ProjectStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                project.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {project.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-6 flex-1 line-clamp-3 leading-relaxed relative z-10">
              {project.description}
            </p>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500 font-mono uppercase tracking-wider">Progreso</span>
                  <span className="font-mono font-bold text-gray-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 border border-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500 text-emerald-500' : 'bg-blue-500 text-blue-500'}`
                    }
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {project.dueDate && (
                <div className="flex items-center gap-2 text-xs text-amber-600 font-mono uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                  <Clock className="w-4 h-4" />
                  Fecha limite: {project.dueDate}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">Nuevo Proyecto</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Nombre del Proyecto</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Feria Cientifica"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Descripcion</label>
                <textarea
                  name="description"
                  required
                  placeholder="Detalles y objetivos del proyecto..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Fecha Limite (Opcional)</label>
                <input
                  name="dueDate"
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all border border-gray-200 font-mono uppercase tracking-widest text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all font-mono uppercase tracking-widest text-sm"
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