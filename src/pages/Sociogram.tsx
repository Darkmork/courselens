import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, RelationalRole, SociogramData } from '../types';
import { Share2, Info, Maximize2, RefreshCw, Users, Upload, AlertCircle, Loader } from 'lucide-react';
import type { Page } from '../App';
import { YearSelector } from '../components/YearSelector';

interface SociogramProps {
  onNavigate?: (page: Page) => void;
}

const Sociogram: React.FC<SociogramProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

  // Real data from Firestore
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [sociogramData, setSociogramData] = useState<SociogramData | null>(null);
  const [isLoadingSociogram, setIsLoadingSociogram] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);

  // Default course ID (should match ImportSociogram component)
  const courseId = 'course-1';

  // Load sociogram data from Firestore
  useEffect(() => {
    if (!courseId) {
      setSociogramData(null);
      setIsLoadingSociogram(false);
      setHasNoData(true);
      return;
    }

    setIsLoadingSociogram(true);
    setHasNoData(false);

    // Listen to Firestore document for selected year
    const docRef = doc(db, `sociogram_${selectedYear}`, courseId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SociogramData;
          setSociogramData(data);
          setHasNoData(false);
        } else {
          setSociogramData(null);
          setHasNoData(true);
        }
        setIsLoadingSociogram(false);
      },
      (error) => {
        console.error('Error loading sociogram data:', error);
        setSociogramData(null);
        setIsLoadingSociogram(false);
        setHasNoData(true);
      }
    );

    // Cleanup listener on unmount or year change
    return () => unsubscribe();
  }, [selectedYear, courseId]);

  // Keep legacy students listener (optional, for fallback)
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsubscribe();
  }, []);

  // Build Cytoscape elements from real Firestore data
  const buildCytoscapeElements = (): cytoscape.ElementDefinition[] => {
    if (!sociogramData) return [];

    const elements: cytoscape.ElementDefinition[] = [];

    // Add student nodes
    sociogramData.estudiantes.forEach((student) => {
      elements.push({
        data: {
          id: student.id,
          label: student.nombre.split(' ')[0], // First name only
          role: student.rol,
          nombre: student.nombre,
          menciones_positivas: student.menciones_positivas.total,
          menciones_negativas: student.menciones_negativas.total,
        },
      });
    });

    // Add relation edges
    sociogramData.relaciones.forEach((rel, index) => {
      elements.push({
        data: {
          id: `${rel.from_id}-${rel.to_id}-${index}`,
          source: rel.from_id,
          target: rel.to_id,
          tipo: rel.tipo,
          fuerza: rel.fuerza,
        },
      });
    });

    return elements;
  };

  useEffect(() => {
    if (!containerRef.current || !sociogramData) return;

    const elements = buildCytoscapeElements();
    if (elements.length === 0) return;

    const cytoscapeInstance = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              const role = ele.data('role');
              switch (role) {
                case 'Líder Positivo':
                  return '#10b981'; // green
                case 'Saludable':
                  return '#8b5cf6'; // purple
                case 'Desafío':
                  return '#ef4444'; // red
                case 'No responde':
                  return '#94a3b8'; // gray
                default:
                  return '#666';
              }
            },
            'border-width': 2,
            'border-color': (ele: any) => {
              const role = ele.data('role');
              switch (role) {
                case 'Líder Positivo':
                  return '#059669';
                case 'Saludable':
                  return '#7c3aed';
                case 'Desafío':
                  return '#dc2626';
                case 'No responde':
                  return '#64748b';
                default:
                  return '#555';
              }
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
            'line-color': (ele: any) => {
              const tipo = ele.data('tipo');
              if (tipo === 'trabajo_positivo') return '#10b981';
              if (tipo === 'convivencia_positiva') return '#3b82f6';
              if (tipo === 'trabajo_negativo') return '#ef4444';
              if (tipo === 'convivencia_negativa') return '#dc2626';
              return '#666';
            },
            'target-arrow-color': (ele: any) => {
              const tipo = ele.data('tipo');
              if (tipo === 'trabajo_positivo') return '#10b981';
              if (tipo === 'convivencia_positiva') return '#3b82f6';
              if (tipo === 'trabajo_negativo') return '#ef4444';
              if (tipo === 'convivencia_negativa') return '#dc2626';
              return '#666';
            },
            'width': (ele: any) => ele.data('fuerza') * 1.5,
            'line-style': (ele: any) => {
              const tipo = ele.data('tipo');
              return tipo.includes('negativo') ? 'dashed' : 'solid';
            },
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
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
  }, [sociogramData]);

  const resetLayout = () => {
    cy?.layout({ name: 'cose', animate: true }).run();
  };

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col items-stretch overflow-hidden">
      <header className="p-4 md:p-8 bg-[#111111]/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-4">
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
        </div>
        <YearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={[2024, 2025, 2026, 2027]}
        />
      </header>

      <div className="flex-1 relative bg-transparent">
        <div ref={containerRef} className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Floating Metrics Overlay */}
        <div className="absolute top-6 left-6 w-64 space-y-4 pointer-events-none">
          <div className="bg-[#111111]/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl pointer-events-auto">
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider font-mono">Salud del Curso</h4>
            {isLoadingSociogram ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-4 h-4 animate-spin text-blue-400" />
              </div>
            ) : sociogramData ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Cohesión</span>
                    <span className="font-bold text-blue-400 font-mono text-sm">
                      {sociogramData.metricas.cohesion.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-blue-500 h-full shadow-[0_0_10px_#3b82f6]"
                      style={{ width: `${(sociogramData.metricas.cohesion / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Fragmentación</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {sociogramData.metricas.fragmentacion.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-amber-500 h-full shadow-[0_0_10px_#f59e0b]"
                      style={{ width: `${sociogramData.metricas.fragmentacion}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-xs py-4">
                Sin datos de sociograma
              </div>
            )}
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

        {isLoadingSociogram && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/80 backdrop-blur-md z-10">
            <div className="text-center p-8 border border-white/10 rounded-3xl bg-[#0a0a0a]">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Loader className="w-8 h-8 animate-spin drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">Cargando Sociograma</h3>
              <p className="text-neutral-500 max-w-xs mx-auto text-sm">Obteniendo datos del año {selectedYear}...</p>
            </div>
          </div>
        )}

        {hasNoData && !isLoadingSociogram && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/80 backdrop-blur-md z-10">
            <div className="text-center p-8 border border-white/10 rounded-3xl bg-[#0a0a0a]">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <AlertCircle className="w-8 h-8 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">Sin Datos de Sociograma</h3>
              <p className="text-neutral-500 max-w-xs mx-auto text-sm">No hay datos de sociograma para {selectedYear}. Importa un reporte de PULSO.cl desde la sección Importar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sociogram;
