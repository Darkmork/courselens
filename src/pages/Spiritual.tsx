import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_COURSE_ID } from '../lib/constants';
import { OrientationSession } from '../types';
import { Sparkles, Plus, BookOpen, Quote } from 'lucide-react';

export default function Spiritual() {
  const [sessions, setSessions] = useState<OrientationSession[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const courseId = DEFAULT_COURSE_ID;

  useEffect(() => {
    const q = query(collection(db, 'sessions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data: OrientationSession[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as OrientationSession);
      });
      data = data.filter(s => !s.courseId || s.courseId === courseId);
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSessions(data);
    }, (error) => {
      console.error('Sessions Error:', error);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'sessions'), {
        courseId,
        topic: formData.get('topic') as string,
        observations: formData.get('observations') as string,
        date: formData.get('date') as string,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            Orientacion y Valores
          </h2>
          <p className="text-gray-500">Registro de reflexiones, espiritualidad y temas valoricos trabajados.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Sesion
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest font-mono">Sin Registros</h3>
            <p className="text-gray-500">Inicia documentando la primera sesion de orientacion del curso.</p>
          </div>
        )}

        {sessions.map(session => (
          <div key={session.id} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold mb-3 tracking-widest uppercase font-mono">
                    {session.date}
                  </span>
                  <h3 className="font-bold text-gray-900 text-2xl tracking-tight leading-tight max-w-[90%] font-display group-hover:text-indigo-600 transition-colors">
                    {session.topic}
                  </h3>
                </div>
              </div>

              <div className="relative flex-1">
                <Quote className="absolute -left-2 -top-2 w-8 h-8 text-gray-200 -z-10 transform -scale-x-100" />
                <p className="text-gray-700 leading-relaxed text-sm pt-2">
                  {session.observations}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 border-2 border-indigo-200 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">Sesion de Reflexion</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">Nueva Sesion</h3>
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Tema / Valor</label>
                <input
                  name="topic"
                  type="text"
                  required
                  placeholder="Ej. Companerismo y Empatia"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Fecha</label>
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Observaciones / Conclusion</label>
                <textarea
                  name="observations"
                  required
                  placeholder="Principales ideas que surgieron del curso..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-32 text-gray-900 placeholder:text-gray-400"
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
                  className="flex-1 py-3 px-6 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all font-mono uppercase tracking-widest text-sm"
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