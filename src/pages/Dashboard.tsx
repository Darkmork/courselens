import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Heart, 
  Users, 
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { collection, query, where, onSnapshot, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Student, RiskStatus, SociogramData } from '../types';
import { DEFAULT_COURSE_ID } from '../lib/constants';
import { motion } from 'motion/react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [sociogramData, setSociogramData] = useState<SociogramData | null>(null);
  const currentYear = new Date().getFullYear();
  const courseId = DEFAULT_COURSE_ID;

  // Load form responses
  useEffect(() => {
    const loadFormResponses = async () => {
      try {
        // Query form_responses collection for this course
        const responsesRef = collection(db, 'form_responses');
        const q = query(responsesRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const responses = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((doc: any) => doc.courseId === courseId);
          setFormResponses(responses);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading form responses:', error);
        setFormResponses([]);
      }
    };
    loadFormResponses();
  }, [courseId]);

  // Load sociogram data for current year
  useEffect(() => {
    const loadSociogramData = async () => {
      try {
        const sociogramRef = doc(db, `sociogram_${currentYear}`, courseId);
        const unsubscribe = onSnapshot(sociogramRef, (docSnap) => {
          if (docSnap.exists()) {
            setSociogramData(docSnap.data() as SociogramData);
          } else {
            setSociogramData(null);
          }
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading sociogram data:', error);
        setSociogramData(null);
      }
    };
    loadSociogramData();
  }, [currentYear, courseId]);

  useEffect(() => {
    const q = query(
      collection(db, 'students'),
      where('courseId', '==', courseId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId]);

  // Load recent conflicts and observations as alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        // Load conflicts
        const conflictQuery = query(
          collection(db, 'conflicts'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const conflictSnapshot = await new Promise((resolve) => {
          const unsubscribe = onSnapshot(conflictQuery, resolve);
          return () => unsubscribe();
        }) as any;

        const conflictAlerts = conflictSnapshot.docs.map((doc: any) => ({
          type: 'conflict',
          title: 'Incidente Registrado',
          student: doc.data().studentName || 'Estudiante',
          desc: doc.data().description || 'Incidente sin descripción',
          time: doc.data().createdAt?.toDate?.().toLocaleDateString?.() || 'Hace poco',
          color: 'amber'
        }));

        // Load observations
        const obsQuery = query(
          collection(db, 'observations'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const obsSnapshot = await new Promise((resolve) => {
          const unsubscribe = onSnapshot(obsQuery, resolve);
          return () => unsubscribe();
        }) as any;

        const obsAlerts = obsSnapshot.docs.map((doc: any) => ({
          type: 'observation',
          title: 'Nota de Seguimiento',
          student: doc.data().studentName || 'Estudiante',
          desc: doc.data().note || 'Nota sin contenido',
          time: doc.data().createdAt?.toDate?.().toLocaleDateString?.() || 'Hace poco',
          color: 'blue'
        }));

        setAlerts([...conflictAlerts, ...obsAlerts].slice(0, 3));
      } catch (error) {
        console.error('Error loading alerts:', error);
        setAlerts([]);
      }
    };

    loadAlerts();
  }, []);

  const riskData = [
    { name: 'Riesgo Alto', value: students.filter(s => s.riskStatus === RiskStatus.RED).length, color: '#ef4444' },
    { name: 'Riesgo Medio', value: students.filter(s => s.riskStatus === RiskStatus.YELLOW).length, color: '#f59e0b' },
    { name: 'Sin Riesgo', value: students.filter(s => s.riskStatus === RiskStatus.GREEN).length, color: '#10b981' },
  ].filter(d => d.value > 0);

  if (riskData.length === 0 && !loading) {
    riskData.push({ name: 'Sin Datos', value: 1, color: '#333333' });
  }

  // Calculate health scores dynamically from student data
  const calculateAcademicScore = () => {
    if (students.length === 0) return 0;
    const performanceMap: { [key: string]: number } = { 'Muy Alto': 9.5, 'Alto': 8.5, 'Promedio': 7.0, 'Bajo': 4.5, 'Muy Bajo': 2.0 };
    const total = students.reduce((sum, s) => sum + (performanceMap[s.academicPerformance as string] || 7.0), 0);
    return Math.round((total / students.length) * 10) / 10;
  };

  const calculateRelationalScore = () => {
    if (students.length === 0) return 0;
    const greenCount = students.filter(s => s.riskStatus === RiskStatus.GREEN).length;
    const yellowCount = students.filter(s => s.riskStatus === RiskStatus.YELLOW).length;
    const redCount = students.filter(s => s.riskStatus === RiskStatus.RED).length;
    const score = (greenCount * 9 + yellowCount * 6 + redCount * 2) / students.length;
    return Math.round(score * 10) / 10;
  };

  const calculateEmotionalScore = () => {
    if (students.length === 0) return 0;
    const score = 5 + (students.filter(s => s.riskStatus === RiskStatus.GREEN).length / students.length) * 4;
    return Math.round(score * 10) / 10;
  };

  const calculateGrowthScore = () => {
    if (students.length === 0) return 0;

    // Base score starts at 5
    let score = 5;

    // Factor 1: Form response engagement (0-3 points)
    // More form responses indicates better engagement and tracking
    const formResponseRatio = Math.min(formResponses.length / students.length, 1);
    score += formResponseRatio * 3;

    // Factor 2: Sociogram cohesion if available (0-2 points)
    if (sociogramData?.metricas?.cohesion) {
      score += (sociogramData.metricas.cohesion / 10) * 2;
    }

    // Factor 3: Positive risk status distribution (0-2.5 points)
    const greenRatio = students.filter(s => s.riskStatus === RiskStatus.GREEN).length / students.length;
    score += greenRatio * 2.5;

    return Math.round(Math.min(score, 10) * 10) / 10;
  };

  const healthScores = [
    { label: 'Académico', value: calculateAcademicScore(), icon: GraduationCap, color: 'text-blue-600', border: 'border-blue-200' },
    { label: 'Relacional', value: calculateRelationalScore(), icon: Users, color: 'text-primary', border: 'border-primary/20' },
    { label: 'Emocional', value: calculateEmotionalScore(), icon: Heart, color: 'text-rose-500', border: 'border-rose-200' },
    { label: 'Crecimiento', value: calculateGrowthScore(), icon: Sparkles, color: 'text-purple-500', border: 'border-purple-200' },
  ];

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseData: { students, healthScores },
          timeframe: 'May 2026'
        })
      });
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
          <p className="text-gray-900 font-mono text-sm">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display mb-2">
            Buenos días, Profe
          </h2>
          <p className="text-primary font-mono text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Monitoreo en tiempo real del ecosistema del curso.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateAIReport}
            disabled={isGeneratingReport}
            className="group relative px-6 py-3 bg-accent hover:bg-accent-dark rounded-xl transition-all duration-300 font-semibold text-white overflow-hidden disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10 flex items-center gap-2">
              {isGeneratingReport ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Sparkles className="w-4 h-4 text-orange-400" />
              )}
              <span className="font-mono text-sm">{isGeneratingReport ? 'COMPILANDO...' : 'REPORTE IA'}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Report Modal */}
      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-hidden">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-3xl h-[80vh] rounded-3xl p-8 shadow-2xl flex flex-col border border-gray-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 font-display">Análisis de IA</h3>
              <button onClick={() => setReport(null)} className="text-gray-400 hover:text-gray-600 font-bold font-mono text-sm transition-colors uppercase tracking-widest">Cerrar [ESC]</button>
            </div>
            <div className="flex-1 overflow-auto prose prose-blue max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 font-sans custom-scrollbar pr-4">
              <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Health Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {healthScores.map((score, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={score.label} 
            className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${score.color} bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
              <score.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">{score.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-gray-900 font-display tracking-tight">
                {score.value}<span className="text-lg text-gray-400 font-normal">/10</span>
              </h3>
              <div className="flex items-center text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Risk Distribution */}
        <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />

          <h3 className="text-lg font-bold text-gray-900 mb-8 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            Estado del Sistema
          </h3>
          <div className="h-48 relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}40)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center mt-1">
                <p className="text-4xl font-bold text-gray-900 font-display tracking-tighter">{students.length}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Nodos Activos</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-auto">
            {riskData.map((d) => (
              <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: d.color, color: d.color }}></div>
                  <span className="text-sm text-gray-700 font-medium">{d.name}</span>
                </div>
                <span className="text-sm font-mono font-bold text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Alerts */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse" />
              Eventos Críticos
            </h3>
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono tracking-widest uppercase rounded-lg flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {alerts.length} {alerts.length === 1 ? 'Requiere' : 'Requieren'} Atención
            </span>
          </div>
          
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay alertas recientes. El curso está en buen estado.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                key={i}
                className={`flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group ${
                  alert.color === 'red' ? 'border-l-4 border-l-red-500' :
                  alert.color === 'amber' ? 'border-l-4 border-l-amber-500' :
                  'border-l-4 border-l-blue-500'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.color === 'red' ? 'bg-red-100 text-red-600 border border-red-200' :
                  alert.color === 'amber' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                  'bg-blue-100 text-blue-600 border border-blue-200'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                    <h4 className="font-bold text-gray-900 truncate font-display text-lg">{alert.title}</h4>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase shrink-0 bg-gray-100 px-2 py-0.5 rounded-md self-start sm:self-auto">{alert.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    <span className="font-semibold text-gray-800">{alert.student}:</span> {alert.desc}
                  </p>
                  <button className="text-xs font-mono font-bold text-gray-500 group-hover:text-primary flex items-center gap-2 transition-all">
                    INICIAR PROTOCOLO <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
              ))
            )}
          </div>

          <button className="w-full mt-6 py-4 text-center text-xs font-mono font-bold tracking-widest uppercase text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
            Cargar Log Completo
          </button>
        </div>
      </div>

      {/* CourseLife Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className="relative group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
            background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.1), transparent 50%)',
          }} />
          <div className="relative z-10">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Importar Formularios</h3>
            <p className="text-sm text-gray-600 mb-4">Carga los 3 momentos de Google Forms (Inicio, Mediados, Final)</p>
            <span className="text-xs font-mono text-blue-600 group-hover:text-blue-700 flex items-center gap-2">
              INICIAR <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="relative group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
            background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168, 85, 247, 0.1), transparent 50%)',
          }} />
          <div className="relative z-10">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Narrativa del Curso</h3>
            <p className="text-sm text-gray-600 mb-4">Visualiza la historia colectiva y la evolución de tu curso</p>
            <span className="text-xs font-mono text-purple-600 group-hover:text-purple-700 flex items-center gap-2">
              EXPLORAR <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="relative group p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
            background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 185, 129, 0.1), transparent 50%)',
          }} />
          <div className="relative z-10">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Perfiles Individuales</h3>
            <p className="text-sm text-gray-600 mb-4">Analiza el viaje de cada estudiante en detalle</p>
            <span className="text-xs font-mono text-primary group-hover:text-primary-dark flex items-center gap-2">
              VER ESTUDIANTES <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </motion.button>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

