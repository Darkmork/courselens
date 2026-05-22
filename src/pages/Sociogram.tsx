import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SociogramData } from '../types';
import { Share2, Info, Upload, AlertCircle, Loader, Sparkles } from 'lucide-react';
import type { Page } from '../App';
import { YearSelector } from '../components/YearSelector';

interface SociogramProps {
  onNavigate?: (page: Page) => void;
}

const Sociogram: React.FC<SociogramProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [sociogramData, setSociogramData] = useState<SociogramData | null>(null);
  const [courseVision, setCourseVision] = useState<any>(null);
  const [isLoadingSociogram, setIsLoadingSociogram] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
  const [sortBy, setSortBy] = useState<'nombre' | 'bienestar' | 'menciones_positivas' | 'menciones_negativas'>('nombre');
  const [isRegenerating, setIsRegenerating] = useState(false);

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

    // Also load course vision analysis
    const analysisRef = doc(db, `sociogram_analysis_${selectedYear}`, courseId);
    const unsubscribeAnalysis = onSnapshot(
      analysisRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCourseVision(docSnap.data());
        } else {
          setCourseVision(null);
        }
      },
      (error) => {
        console.error('Error loading course vision:', error);
        setCourseVision(null);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeAnalysis();
    };
  }, [selectedYear, courseId]);

  const handleRegenerateCourseVision = async () => {
    if (!sociogramData) return;

    setIsRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-course-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          courseId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const data = await response.json();
      setCourseVision(data.courseVision);
      alert('✓ Análisis del curso regenerado exitosamente');
    } catch (error) {
      console.error('Error regenerating course vision:', error);
      alert(`Error al regenerar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getSortedStudents = () => {
    if (!sociogramData) return [];

    const students = [...sociogramData.estudiantes];

    switch (sortBy) {
      case 'bienestar':
        return students.sort((a, b) =>
          (b.autoreporte?.bienestar_general || 0) - (a.autoreporte?.bienestar_general || 0)
        );
      case 'menciones_positivas':
        return students.sort((a, b) =>
          (b.menciones_positivas?.total || 0) - (a.menciones_positivas?.total || 0)
        );
      case 'menciones_negativas':
        return students.sort((a, b) =>
          (b.menciones_negativas?.total || 0) - (a.menciones_negativas?.total || 0)
        );
      default:
        return students.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol?.toLowerCase()) {
      case 'líder positivo':
        return 'bg-green-900/30 border-green-600 text-green-300';
      case 'saludable':
      case 'amistoso(a)':
        return 'bg-purple-900/30 border-purple-600 text-purple-300';
      case 'desafío':
      case 'dificultad para trabajar en grupo':
        return 'bg-red-900/30 border-red-600 text-red-300';
      default:
        return 'bg-gray-900/30 border-gray-600 text-gray-300';
    }
  };

  const getRiskLevel = (menciones_negativas: number, bienestar: number) => {
    if (menciones_negativas >= 3 || bienestar <= 2) return '🔴 Alto';
    if (menciones_negativas >= 1 || bienestar <= 3) return '🟡 Medio';
    return '🟢 Bajo';
  };

  const sortedStudents = getSortedStudents();

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-8 bg-[#111111]/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Share2 className="w-8 h-8 text-blue-600" />
              Inteligencia Relacional
            </h2>
            <p className="text-sm text-neutral-400">Datos de dinámicas interpersonales y bienestar del curso</p>
          </div>
          <div className="flex gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate?.('import-sociogram' as Page)}
                className="p-3 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30"
                title="Importar desde PULSO.cl"
              >
                <Upload className="w-5 h-5" />
              </button>
            )}
            {sociogramData && (
              <button
                onClick={handleRegenerateCourseVision}
                disabled={isRegenerating}
                className="p-3 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-all border border-purple-500/30 disabled:opacity-50"
                title="Regenerar análisis del curso"
              >
                {isRegenerating ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              className="p-3 bg-[#111] text-neutral-400 rounded-xl hover:bg-[#1a1a1a] transition-all border border-white/10"
              title="Información"
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

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
        {isLoadingSociogram && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center p-8 border border-blue-500/20 rounded-lg bg-blue-900/10">
              <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Cargando Sociograma</h3>
              <p className="text-neutral-500">Obteniendo datos del año {selectedYear}...</p>
            </div>
          </div>
        )}

        {hasNoData && !isLoadingSociogram && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center p-8 border border-amber-500/20 rounded-lg bg-amber-900/10">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Sin Datos de Sociograma</h3>
              <p className="text-neutral-500 mb-4">No hay datos para {selectedYear}</p>
              <button
                onClick={() => onNavigate?.('import-sociogram' as Page)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Importar Datos
              </button>
            </div>
          </div>
        )}

        {sociogramData && !isLoadingSociogram && (
          <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-mono">Estudiantes</p>
                <p className="text-3xl font-bold text-white mt-2">{sociogramData.estudiantes.length}</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-mono">Cohesión</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{sociogramData.metricas.cohesion.toFixed(1)}/10</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-mono">Fragmentación</p>
                <p className="text-3xl font-bold text-amber-400 mt-2">{sociogramData.metricas.fragmentacion.toFixed(1)}%</p>
              </div>
            </div>

            {/* Resumen de Estudiantes Card */}
            {(() => {
              const roleCount = {
                'líder positivo': 0,
                'saludable': 0,
                'amistoso(a)': 0,
                'desafío': 0,
                'no responde': 0
              };
              let totalBienestar = 0;
              let bienestarCount = 0;
              let atRiskCount = 0;

              sociogramData.estudiantes.forEach(student => {
                const rol = (student.rol || 'no responde').toLowerCase();
                if (rol in roleCount) {
                  roleCount[rol as keyof typeof roleCount]++;
                }
                const bienestar = student.autoreporte?.bienestar_general || 0;
                const mencNegativas = student.menciones_negativas?.total || 0;
                if (bienestar > 0) {
                  totalBienestar += bienestar;
                  bienestarCount++;
                }
                if (mencNegativas >= 3 || bienestar <= 2) {
                  atRiskCount++;
                }
              });

              const avgBienestar = bienestarCount > 0 ? (totalBienestar / bienestarCount).toFixed(1) : '0';

              return (
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 border border-blue-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">📊 Resumen de Estudiantes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-gray-800/40 rounded p-3">
                      <p className="text-gray-400 text-xs">Líderes Positivos</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">{roleCount['líder positivo']}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded p-3">
                      <p className="text-gray-400 text-xs">Saludables</p>
                      <p className="text-2xl font-bold text-purple-400 mt-1">{roleCount['saludable'] + roleCount['amistoso(a)']}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded p-3">
                      <p className="text-gray-400 text-xs">Desafíos</p>
                      <p className="text-2xl font-bold text-red-400 mt-1">{roleCount['desafío']}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded p-3">
                      <p className="text-gray-400 text-xs">Promedio Bienestar</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">{avgBienestar}/5</p>
                    </div>
                    <div className="bg-gray-800/40 rounded p-3">
                      <p className="text-gray-400 text-xs">Estudiantes en Riesgo</p>
                      <p className="text-2xl font-bold text-orange-400 mt-1">🔴 {atRiskCount}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Salud del Curso Card */}
            {courseVision && (
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 border border-purple-700/50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">💜 Salud del Curso</h3>

                {/* Course Vision Narrative */}
                <div>
                  <p className="text-sm text-gray-400 font-semibold mb-2">Visión del Curso</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{courseVision.course_vision}</p>
                </div>

                {/* Highlighted Students */}
                {courseVision.highlighted_students && courseVision.highlighted_students.length > 0 && (
                  <div>
                    <p className="text-sm text-green-400 font-semibold mb-2">⭐ Estudiantes Destacados</p>
                    <div className="space-y-2">
                      {courseVision.highlighted_students.map((student: any, idx: number) => (
                        <div key={idx} className="bg-green-900/20 border border-green-700 rounded p-2 text-sm">
                          <p className="font-semibold text-green-300">{student.nombre}</p>
                          <p className="text-gray-300 text-xs mt-1">{student.reason}</p>
                          {student.strengths && student.strengths.length > 0 && (
                            <ul className="text-xs text-gray-400 mt-1 space-y-0.5 ml-2">
                              {student.strengths.map((s: string, i: number) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* At-Risk Students */}
                {courseVision.at_risk_students && courseVision.at_risk_students.length > 0 && (
                  <div>
                    <p className="text-sm text-orange-400 font-semibold mb-2">⚠️ Requieren Atención</p>
                    <div className="space-y-2">
                      {courseVision.at_risk_students.map((student: any, idx: number) => (
                        <div key={idx} className="bg-orange-900/20 border border-orange-700 rounded p-2 text-sm">
                          <p className="font-semibold text-orange-300">{student.nombre}</p>
                          <p className="text-gray-300 text-xs mt-1">{student.reason}</p>
                          {student.concerns && student.concerns.length > 0 && (
                            <ul className="text-xs text-gray-400 mt-1 space-y-0.5 ml-2">
                              {student.concerns.map((c: string, i: number) => (
                                <li key={i}>• {c}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamics Summary */}
                {courseVision.dynamics_summary && (
                  <div>
                    <p className="text-sm text-blue-400 font-semibold mb-2">🔗 Dinámicas del Grupo</p>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{courseVision.dynamics_summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sort Controls */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-gray-400 text-sm self-center">Ordenar por:</span>
              {(['nombre', 'bienestar', 'menciones_positivas', 'menciones_negativas'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1 text-sm rounded transition ${
                    sortBy === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option === 'nombre' && 'Nombre'}
                  {option === 'bienestar' && 'Bienestar'}
                  {option === 'menciones_positivas' && 'Menciones Positivas'}
                  {option === 'menciones_negativas' && 'Menciones Negativas'}
                </button>
              ))}
            </div>

            {/* Students Table */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">Estudiante</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Rol</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Bienestar</th>
                    <th className="px-4 py-3 text-center text-green-400 font-semibold">✓ Menciones</th>
                    <th className="px-4 py-3 text-center text-red-400 font-semibold">✗ Menciones</th>
                    <th className="px-4 py-3 text-center text-yellow-400 font-semibold">Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedStudents.map((student) => {
                    const bienestar = student.autoreporte?.bienestar_general || 0;
                    const mencPositivas = student.menciones_positivas?.total || 0;
                    const mencNegativas = student.menciones_negativas?.total || 0;

                    return (
                      <tr key={student.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-4 py-3 text-white font-medium">{student.nombre}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded border ${getRoleColor(student.rol)}`}>
                            {student.rol || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-bold ${
                            bienestar >= 4 ? 'text-green-400' :
                            bienestar >= 3 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {bienestar}/5
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-xs font-semibold">
                            {mencPositivas}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            mencNegativas > 0
                              ? 'bg-red-900/30 text-red-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {mencNegativas}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {getRiskLevel(mencNegativas, bienestar)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Roles</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> <span className="text-gray-300">Líder Positivo</span></li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> <span className="text-gray-300">Saludable / Amistoso(a)</span></li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span> <span className="text-gray-300">Desafío</span></li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-500 rounded-full"></span> <span className="text-gray-300">No responde</span></li>
                </ul>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Niveles de Riesgo</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="text-lg">🔴</span> <span className="text-gray-300">Alto: menciones negativas ≥3 o bienestar ≤2</span></li>
                  <li className="flex items-center gap-2"><span className="text-lg">🟡</span> <span className="text-gray-300">Medio: menciones negativas ≥1 o bienestar ≤3</span></li>
                  <li className="flex items-center gap-2"><span className="text-lg">🟢</span> <span className="text-gray-300">Bajo: sin menciones negativas y bienestar mayor a 3</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sociogram;
