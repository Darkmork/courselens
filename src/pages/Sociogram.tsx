import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, RelationalRole } from '../types';
import { Share2, Info, Maximize2, RefreshCw, Users, Upload } from 'lucide-react';
import type { Page } from '../App';

interface SociogramProps {
  onNavigate?: (page: Page) => void;
}

const Sociogram: React.FC<SociogramProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!containerRef.current || students.length === 0) return;

    // Create mock edges if needed for visualization logic
    const elements: cytoscape.ElementDefinition[] = students.map(s => ({
      data: { 
        id: s.id, 
        label: s.name.split(' ')[0],
        role: s.relationalRole 
      }
    }));

    // Simple mock edges for visual interest
    if (students.length > 2) {
      for (let i = 0; i < students.length; i++) {
        const targetIndex = (i + 1) % students.length;
        const targetIndex2 = (i + 3) % students.length;
        elements.push({
          data: { 
            id: `e${i}-${targetIndex}`, 
            source: students[i].id, 
            target: students[targetIndex].id,
            type: Math.random() > 0.8 ? 'tension' : 'positive'
          }
        });
        if (Math.random() > 0.5) {
          elements.push({
            data: { 
              id: `e${i}-${targetIndex2}`, 
              source: students[i].id, 
              target: students[targetIndex2].id,
              type: 'positive'
            }
          });
        }
      }
    }

    const cytoscapeInstance = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#050505',
            'border-width': 2,
            'border-color': (ele) => {
              const role = ele.data('role');
              if (role === RelationalRole.LEADER) return '#60a5fa';
              if (role === RelationalRole.ISOLATED) return '#94a3b8';
              if (role === RelationalRole.IN_CONFLICT) return '#f87171';
              return '#34d399';
            },
            'width': 60,
            'height': 60,
            'label': 'data(label)',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-color': '#050505',
            'text-outline-width': 2,
            'font-family': 'monospace',
            'text-transform': 'uppercase'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': (ele) => ele.data('type') === 'tension' ? '#991b1b' : '#333',
            'target-arrow-color': (ele) => ele.data('type') === 'tension' ? '#991b1b' : '#333',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': (ele) => ele.data('type') === 'tension' ? 'dashed' : 'solid',
            'opacity': 0.6
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        padding: 50
      }
    });

    setCy(cytoscapeInstance);

    return () => cytoscapeInstance.destroy();
  }, [students]);

  const resetLayout = () => {
    cy?.layout({ name: 'cose', animate: true }).run();
  };

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col items-stretch overflow-hidden">
      <header className="p-4 md:p-8 bg-[#111111]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Share2 className="w-8 h-8 text-blue-600" />
            Inteligencia Relacional
          </h2>
          <p className="text-sm text-neutral-400">Mapeo visual de dinámicas interpersonales y cohesión grupal.</p>
        </div>
        <div className="flex gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate?.('import-sociogram' as Page)}
              className="p-3 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30 shadow-sm hover:text-blue-300"
              title="Importar desde PULSO.cl"
            >
              <Upload className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={resetLayout}
            className="p-3 bg-[#111] text-neutral-400 rounded-xl hover:bg-[#1a1a1a] transition-all border border-white/10 shadow-sm hover:text-white"
            title="Actualizar Diseño"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            className="p-3 bg-[#111] text-neutral-400 rounded-xl hover:bg-[#1a1a1a] transition-all border border-white/10 shadow-sm hover:text-white"
            title="Leyenda"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 relative bg-transparent">
        <div ref={containerRef} className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Floating Metrics Overlay */}
        <div className="absolute top-6 left-6 w-64 space-y-4 pointer-events-none">
          <div className="bg-[#111111]/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl pointer-events-auto">
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider font-mono">Salud del Curso</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-500 font-mono">Cohesión</span>
                  <span className="font-bold text-blue-400 font-mono text-sm">6.8/10</span>
                </div>
                <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-blue-500 h-full w-[68%] shadow-[0_0_10px_#3b82f6]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-500 font-mono">Fragmentación</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">40%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-amber-500 h-full w-[40%] shadow-[0_0_10px_#f59e0b]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl pointer-events-auto">
            <h4 className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-widest font-mono border-b border-white/10 pb-2">Leyenda</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" /> Líder
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" /> Conexión Saludable
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-2 h-2 bg-slate-400 rounded-full shadow-[0_0_8px_#94a3b8]" /> Aislado
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_#f87171]" /> En Conflicto
              </li>
            </ul>
          </div>
        </div>

        {students.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/80 backdrop-blur-md z-10">
            <div className="text-center p-8 border border-white/10 rounded-3xl bg-[#0a0a0a]">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Users className="w-8 h-8 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">Puebla el Directorio</h3>
              <p className="text-neutral-500 max-w-xs mx-auto text-sm">Agrega estudiantes para ver automáticamente las dinámicas de relación del curso.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sociogram;
