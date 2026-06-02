import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conflict, ConflictStatus, Severity, Student } from '../types';

const Conflicts: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const qC = query(collection(db, 'conflicts'));
    const unsubscribeC = onSnapshot(qC, (snapshot) => {
      setConflicts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conflict)));
    });

    const qS = query(collection(db, 'students'));
    const unsubscribeS = onSnapshot(qS, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    return () => {
      unsubscribeC();
      unsubscribeS();
    };
  }, []);

  const handleAddConflict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedStudents = Array.from(formData.getAll('students') as string[]);

    const newConflict = {
      courseId: 'default-course',
      date: new Date().toISOString().split('T')[0],
      description: formData.get('description') as string,
      severity: formData.get('severity') as Severity,
      status: ConflictStatus.OPEN,
      studentIds: selectedStudents,
    };

    try {
      await addDoc(collection(db, 'conflicts'), {
        ...newConflict,
        createdAt: serverTimestamp(),
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding conflict:', error);
    }
  };

  const resolveConflict = async (id: string) => {
    try {
      await updateDoc(doc(db, 'conflicts', id), {
        status: ConflictStatus.RESOLVED,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-sans flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Registro de Convivencia
          </h2>
          <p className="text-gray-500">Registra, resuelve y analiza incidentes del curso.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Incidente
        </button>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Active Conflicts List */}
        <div className="lg:col-span-3 space-y-4">
          {conflicts.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest font-mono">Sala en Paz</h3>
              <p className="text-gray-500">No hay conflictos activos registrados en este momento.</p>
            </div>
          )}

          {conflicts.map((conflict) => (
            <div key={conflict.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                conflict.severity === Severity.HIGH ? 'bg-red-500' :
                conflict.severity === Severity.MEDIUM ? 'bg-amber-500' : 'bg-blue-500'
              }`}></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    conflict.status === ConflictStatus.RESOLVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {conflict.status === ConflictStatus.RESOLVED ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex -space-x-2">
                    {conflict.studentIds.map(sid => {
                      const s = students.find(st => st.id === sid);
                      return (
                        <div key={sid} className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
                          {s?.name[0] || '?'}
                        </div>
                      );
                    })}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    conflict.severity === Severity.HIGH ? 'bg-red-50 text-red-600 border-red-200' :
                    conflict.severity === Severity.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    Severidad {conflict.severity}
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-mono tracking-widest">{conflict.date}</span>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed font-sans">{conflict.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conflict.studentIds.map(sid => {
                    const s = students.find(st => st.id === sid);
                    return s && <span key={sid} className="text-xs font-mono font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">@{s.name.split(' ')[0]}</span>;
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {conflict.status !== ConflictStatus.RESOLVED ? (
                  <button
                    onClick={() => resolveConflict(conflict.id)}
                    className="text-xs font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 group/resolve transition-all"
                  >
                    RESOLVER INCIDENTE <ArrowRight className="w-3 h-3 group-hover/resolve:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> ARCHIVADO
                  </span>
                )}
                <button className="text-xs font-mono font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
                  BITÁCORA <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 relative overflow-hidden">
            <h4 className="text-xs font-bold text-amber-600 mb-4 uppercase tracking-widest font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Directivas
            </h4>
            <ul className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <li className="flex gap-2">
                <span className="font-mono text-amber-400 shrink-0">01</span>
                <span>Aislamiento de entidades para analisis no contaminado.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-400 shrink-0">02</span>
                <span>Reconstruccion de topologia en el grafo relacional.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-400 shrink-0">03</span>
                <span>Establecimiento de SLA vinculantes.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center relative overflow-hidden">
            <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase font-mono tracking-widest">Frecuencia Critica</h4>
            <div className="text-5xl font-black text-gray-900 mb-2 font-display">5</div>
            <p className="text-xs text-gray-500 mb-4 font-mono uppercase tracking-wider">Eventos Ciclicos</p>
            <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200 inline-flex">
              20% DELTA PREVIO
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">Log de Anomalia</h3>
            <form onSubmit={handleAddConflict} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Payload Analitico</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Descripcion objetiva del evento..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Nodos Afectados</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                      <input type="checkbox" name="students" value={s.id} className="rounded border-gray-300 bg-white text-red-500 focus:ring-red-500 focus:ring-offset-white" />
                      <span className="text-xs font-semibold text-gray-700 truncate font-mono uppercase">{s.name}</span>
                    </label>
                  ))}
                </div>
                {students.length === 0 && <p className="text-xs text-gray-400 mt-2 font-mono">Sin nodos en el pool.</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Gravedad</label>
                <div className="flex gap-2">
                  {[Severity.LOW, Severity.MEDIUM, Severity.HIGH].map(s => (
                    <label key={s} className="flex-1">
                      <input type="radio" name="severity" value={s} defaultChecked={s === Severity.LOW} className="sr-only peer" />
                      <div className={`
                        text-center py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all font-mono uppercase tracking-widest
                        peer-checked:bg-red-100 peer-checked:text-red-600 peer-checked:border-red-300
                        border-gray-200 text-gray-500 hover:bg-gray-50
                      `}>
                        {s}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all border border-gray-200 font-mono uppercase tracking-widest"
                >
                  Abortar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all font-mono uppercase tracking-widest"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conflicts;