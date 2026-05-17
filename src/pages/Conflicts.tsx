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
          <h2 className="text-3xl font-bold text-white tracking-tight text-sans flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            Registro de Convivencia
          </h2>
          <p className="text-neutral-400">Registra, resuelve y analiza incidentes del curso.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Incidente
        </button>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Active Conflicts List */}
        <div className="lg:col-span-3 space-y-4">
          {conflicts.length === 0 && (
            <div className="py-20 text-center bg-[#111111]/50 rounded-3xl border-2 border-dashed border-white/10">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-widest font-mono">Sala en Paz</h3>
              <p className="text-neutral-500">No hay conflictos activos registrados en este momento.</p>
            </div>
          )}

          {conflicts.map((conflict) => (
            <div key={conflict.id} className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-md hover:border-white/20 transition-all group overflow-hidden relative">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                conflict.severity === Severity.HIGH ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
                conflict.severity === Severity.MEDIUM ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'
              }`}></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    conflict.status === ConflictStatus.RESOLVED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-neutral-400 border-white/10'
                  }`}>
                    {conflict.status === ConflictStatus.RESOLVED ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex -space-x-2">
                    {conflict.studentIds.map(sid => {
                      const s = students.find(st => st.id === sid);
                      return (
                        <div key={sid} className="h-8 w-8 rounded-full bg-[#1A1A1A] border-2 border-[#111111] overflow-hidden shadow-sm flex items-center justify-center text-[10px] font-bold text-neutral-400 uppercase">
                          {s?.name[0] || '?'}
                        </div>
                      );
                    })}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    conflict.severity === Severity.HIGH ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    conflict.severity === Severity.MEDIUM ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    Severidad {conflict.severity}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 font-mono tracking-widest">{conflict.date}</span>
              </div>

              <div className="mb-6">
                <p className="text-neutral-300 leading-relaxed font-sans">{conflict.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conflict.studentIds.map(sid => {
                    const s = students.find(st => st.id === sid);
                    return s && <span key={sid} className="text-xs font-mono font-bold text-neutral-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">@{s.name.split(' ')[0]}</span>;
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                {conflict.status !== ConflictStatus.RESOLVED ? (
                  <button 
                    onClick={() => resolveConflict(conflict.id)}
                    className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 group/resolve transition-all"
                  >
                    RESOLVER INCIDENTE <ArrowRight className="w-3 h-3 group-hover/resolve:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> ARCHIVADO
                  </span>
                )}
                <button className="text-xs font-mono font-bold text-neutral-500 hover:text-white flex items-center gap-2 transition-colors">
                  BITÁCORA <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
            <h4 className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              Directivas
            </h4>
            <ul className="text-xs text-neutral-400 space-y-3 leading-relaxed">
              <li className="flex gap-2">
                <span className="font-mono text-amber-500/50 shrink-0">01</span>
                <span>Aislamiento de entidades para análisis no contaminado.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-500/50 shrink-0">02</span>
                <span>Reconstrucción de topología en el grafo relacional.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-500/50 shrink-0">03</span>
                <span>Establecimiento de SLA vinculantes.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-sm text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
            <h4 className="text-xs font-bold text-neutral-500 mb-4 uppercase font-mono tracking-widest">Frecuencia Crítica</h4>
            <div className="text-5xl font-black text-white mb-2 font-display">5</div>
            <p className="text-xs text-neutral-500 mb-4 font-mono uppercase tracking-wider">Eventos Cíclicos</p>
            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-full border border-emerald-500/20 inline-flex">
              ↓ 20% DELTA PREVIO
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 font-display">Log de Anomalía</h3>
            <form onSubmit={handleAddConflict} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Payload Analítico</label>
                <textarea 
                  name="description"
                  required
                  rows={3}
                  placeholder="Descripción objetiva del evento..."
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-white placeholder:text-neutral-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Nodos Afectados</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#111111] rounded-2xl border border-white/10">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/10">
                      <input type="checkbox" name="students" value={s.id} className="rounded border-white/20 bg-black text-red-500 focus:ring-red-500 focus:ring-offset-black" />
                      <span className="text-xs font-semibold text-neutral-300 truncate font-mono uppercase">{s.name}</span>
                    </label>
                  ))}
                </div>
                {students.length === 0 && <p className="text-xs text-neutral-500 mt-2 font-mono">Sin nodos en el pool.</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Gravedad</label>
                <div className="flex gap-2">
                  {[Severity.LOW, Severity.MEDIUM, Severity.HIGH].map(s => (
                    <label key={s} className="flex-1">
                      <input type="radio" name="severity" value={s} defaultChecked={s === Severity.LOW} className="sr-only peer" />
                      <div className={`
                        text-center py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all font-mono uppercase tracking-widest
                        peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50
                        border-white/10 text-neutral-500 hover:bg-white/5
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
                  className="flex-1 py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5 font-mono uppercase tracking-widest"
                >
                  Abortar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] font-mono uppercase tracking-widest"
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
