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
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

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
    sociogramData.estudiantes.forEach((student: any) => {
      const studentId = student.id || student.nombre.toLowerCase().replace(/\s+/g, '-');
      const positiveMentions = student.menciones_positivas?.total ||
                               Object.values(student.menciones_positivas || {})
                                 .filter(v => typeof v === 'number')
                                 .reduce((a: number, b: any) => a + b, 0) || 0;
      const negativeMentions = student.menciones_negativas?.total ||
                               Object.values(student.menciones_negativas || {})
                                 .filter(v => typeof v === 'number')
                                 .reduce((a: number, b: any) => a + b, 0) || 0;

      elements.push({
        data: {
          id: studentId,
          label: student.nombre.split(' ')[0], // First name only
          role: student.rol,
          nombre: student.nombre,
          menciones_positivas: positiveMentions,
          menciones_negativas: negativeMentions,
        },
      });
    });

    // Add relation edges
    sociogramData.relaciones.forEach((rel: any, index: number) => {
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

    console.log(`[Sociogram] Built ${elements.length} elements: ${sociogramData.estudiantes.length} nodes, ${sociogramData.relaciones.length} edges`);
    return elements;
  };

  useEffect(() => {
    if (!containerRef.current || !sociogramData) {
      console.log('[Sociogram] Skipping cytoscape init:', {
        hasContainer: !!containerRef.current,
        hasData: !!sociogramData
      });
      return;
    }

    console.log('[Sociogram] Initializing cytoscape with data:', {
      students: sociogramData.estudiantes.length,
      relations: sociogramData.relaciones.length
    });

    const elements = buildCytoscapeElements();
    if (elements.length === 0) {
      console.warn('[Sociogram] No elements to render!');
      return;
    }

    try {
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
              'width': (ele: any) => ele.data('fuerza') * 2,
              'line-style': (ele: any) => {
                const tipo = ele.data('tipo');
                // Trabajo = solid, Convivencia = dotted
                if (tipo === 'trabajo_positivo' || tipo === 'trabajo_negativo') return 'solid';
                if (tipo === 'convivencia_positiva' || tipo === 'convivencia_negativa') return 'dotted';
                return 'solid';
              },
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'opacity': 0.8,
              'text-opacity': 0.8,
              'font-size': 9
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          padding: 50
        }
      });

      console.log('[Sociogram] Cytoscape initialized successfully');

      // Add node click listener to select student
      cytoscapeInstance.on('tap', 'node', (evt) => {
        const node = evt.target;
        const studentId = node.data('id');
        const student = sociogramData?.estudiantes.find((s: any) => s.id === studentId);
        if (student) {
          setSelectedStudent(student);
          console.log('[Sociogram] Selected student:', student.nombre);
        }
      });

      // Click elsewhere to deselect
      cytoscapeInstance.on('tap', (evt) => {
        if (evt.target === cytoscapeInstance) {
          setSelectedStudent(null);
        }
      });

      // Apply layout and fit to view
      setTimeout(() => {
        try {
          cytoscapeInstance.layout({ name: 'cose', animate: true, padding: 50 }).run();
          cytoscapeInstance.fit(undefined, 50);
          console.log('[Sociogram] Layout and fit applied');
        } catch (layoutError) {
          console.error('[Sociogram] Layout error:', layoutError);
        }
      }, 100);

      setCy(cytoscapeInstance);

      return () => cytoscapeInstance.destroy();
    } catch (error) {
      console.error('[Sociogram] Failed to initialize Cytoscape:', error);
    }
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

      <div className="flex-1 flex flex-col relative bg-transparent overflow-hidden">
        <div className="flex-1 relative">
          <div ref={containerRef} className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px', width: '100%', height: '100%' }} />

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
            <h4 className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-widest font-mono border-b border-white/10 pb-2">Leyenda Roles</h4>
            <ul className="space-y-3 mb-4 pb-4 border-b border-white/10">
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_#10b981]" /> Líder Positivo
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_8px_#8b5cf6]" /> Saludable
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" /> Desafío
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="w-3 h-3 bg-gray-500 rounded-full shadow-[0_0_8px_#94a3b8]" /> No responde
              </li>
            </ul>
            <h4 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-widest font-mono">Relaciones</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="h-0.5 w-4 bg-green-500 shadow-[0_0_6px_#10b981]" /> Trabajo Positivo
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <div className="h-0.5 w-4 bg-red-500 shadow-[0_0_6px_#ef4444]" /> Trabajo Negativo
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <svg className="w-4 h-0.5" viewBox="0 0 16 1" preserveAspectRatio="none">
                  <circle cx="2" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="4" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="6" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="8" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="10" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="12" cy="0.5" r="0.4" fill="#3b82f6" />
                  <circle cx="14" cy="0.5" r="0.4" fill="#3b82f6" />
                </svg>
                <span>Convivencia Positiva</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                <svg className="w-4 h-0.5" viewBox="0 0 16 1" preserveAspectRatio="none">
                  <circle cx="2" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="4" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="6" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="8" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="10" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="12" cy="0.5" r="0.4" fill="#dc2626" />
                  <circle cx="14" cy="0.5" r="0.4" fill="#dc2626" />
                </svg>
                <span>Convivencia Negativa</span>
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

        {/* Student Data Table */}
        {sociogramData && !isLoadingSociogram && (
          <div className="border-t border-white/10 bg-[#111111]/50 backdrop-blur-sm overflow-hidden flex flex-col max-h-64">
            <div className="px-6 py-3 bg-[#0a0a0a]/80 border-b border-white/5 shrink-0">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Datos de Estudiantes</h4>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]/90 border-b border-white/5">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-neutral-300 text-xs uppercase tracking-wider font-mono">Nombre</th>
                    <th className="px-4 py-2 text-left font-bold text-neutral-300 text-xs uppercase tracking-wider font-mono">Rol</th>
                    <th className="px-4 py-2 text-center font-bold text-neutral-300 text-xs uppercase tracking-wider font-mono">Autoreporte</th>
                    <th className="px-4 py-2 text-center font-bold text-neutral-300 text-xs uppercase tracking-wider font-mono">Menciones +</th>
                    <th className="px-4 py-2 text-center font-bold text-neutral-300 text-xs uppercase tracking-wider font-mono">Menciones -</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sociogramData.estudiantes.map((student: any) => {
                    const positiveMentions = student.menciones_positivas?.total ||
                                           Object.values(student.menciones_positivas || {})
                                             .filter(v => typeof v === 'number')
                                             .reduce((a: number, b: any) => a + b, 0) || 0;
                    const negativeMentions = student.menciones_negativas?.total ||
                                           Object.values(student.menciones_negativas || {})
                                             .filter(v => typeof v === 'number')
                                             .reduce((a: number, b: any) => a + b, 0) || 0;

                    // Calculate autoreporte average if it's an object
                    let autoreporteScore = 0;
                    if (typeof student.autoreporte === 'number') {
                      autoreporteScore = student.autoreporte;
                    } else if (typeof student.autoreporte === 'object' && student.autoreporte) {
                      const scores = Object.values(student.autoreporte)
                        .filter(v => typeof v === 'number') as number[];
                      autoreporteScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                    }

                    const isSelected = selectedStudent?.id === student.id;

                    return (
                      <tr
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`cursor-pointer transition-all hover:bg-white/5 ${
                          isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : 'bg-transparent'
                        }`}
                      >
                        <td className="px-4 py-2 font-mono text-neutral-100">{student.nombre}</td>
                        <td className="px-4 py-2 text-xs font-mono">
                          <span className={`px-2 py-1 rounded-full ${
                            student.rol === 'Líder Positivo'
                              ? 'bg-green-500/20 text-green-300'
                              : student.rol === 'Saludable'
                              ? 'bg-purple-500/20 text-purple-300'
                              : student.rol === 'Desafío'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {student.rol || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {autoreporteScore > 0 ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                              <span className="font-bold text-blue-400 text-xs font-mono">
                                {autoreporteScore.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-300 font-bold text-xs font-mono">
                            {positiveMentions}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-300 font-bold text-xs font-mono">
                            {negativeMentions}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sociogram;
