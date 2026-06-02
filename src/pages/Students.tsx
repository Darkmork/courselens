import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  BrainCircuit,
  UserPlus,
  Upload,
  Mail,
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, RiskStatus } from '../types';
import AddStudentModal from '../components/AddStudentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import StudentProfileModal from '../components/StudentProfileModal';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Page } from '../App';

interface StudentsProps {
  onNavigate?: (page: Page) => void;
}

const Students: React.FC<StudentsProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsubscribe();
  }, []);

  const openProfileModal = (student: Student) => {
    setProfileStudent(student);
    setIsProfileModalOpen(true);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const analyzeRisk = async (student: Student) => {
    setIsAnalyzing(student.id);
    try {
      const response = await fetch('/api/ai/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: student })
      });
      const data = await response.json();
      console.log('AI Risk Assessment:', data);
      alert(`Evaluación de IA para ${student.name}:\nRiesgo: ${data.riskStatus}\nFactores: ${data.contributingFactors}\nRecomendación: ${data.recommendedInterventions}`);
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleEmailParent = (email: string | undefined, studentName: string) => {
    if (!email) {
      alert('El apoderado no tiene un correo registrado.');
      return;
    }
    const subject = encodeURIComponent(`Comunicación del Colegio: ${studentName}`);
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-sans">Directorio de Alumnos</h2>
          <p className="text-gray-500">Gestiona perfiles, seguimiento e intervenciones.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate?.('import-forms')}
            className="px-6 py-3 bg-green-600/20 text-green-400 rounded-2xl font-bold hover:bg-green-600/30 transition-all border border-green-500/30 flex items-center justify-center gap-2 shadow-sm"
            title="Importar Formularios"
          >
            <Upload className="w-5 h-5" />
            Formularios
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-6 py-3 bg-white border border-gray-300 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Importar CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Agregar
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-white border border-gray-300 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-sm">
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl -mr-16 -mt-16 rounded-full ${
              student.riskStatus === RiskStatus.RED ? 'bg-red-500' :
              student.riskStatus === RiskStatus.YELLOW ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-16 w-16 bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden text-2xl font-bold text-gray-500">
                {student.photoUrl ? <img src={student.photoUrl} alt="" className="w-full h-full object-cover" /> : student.name[0]}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                student.riskStatus === RiskStatus.RED ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                student.riskStatus === RiskStatus.YELLOW ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                Riesgo {student.riskStatus}
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <button onClick={() => openProfileModal(student)} className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase font-display text-left">
                {student.name}
              </button>
              <p className="text-xs text-gray-500 font-mono tracking-tighter">RUT: {student.rut}</p>
              {student.guardian1Name && <p className="text-xs text-gray-600 mt-2 truncate">Apoderado: {student.guardian1Name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button
                onClick={() => analyzeRisk(student)}
                disabled={isAnalyzing === student.id}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-500/20 transition-colors disabled:opacity-50 border border-blue-500/20"
              >
                {isAnalyzing === student.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <BrainCircuit className="w-4 h-4" />
                )}
                {isAnalyzing === student.id ? 'Analizando' : 'Evaluar IA'}
              </button>
              <button
                onClick={() => openProfileModal(student)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors border border-gray-200"
              >
                <UserPlus className="w-4 h-4" />
                Ver Detalle & Contacto
              </button>
            </div>

            <button className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest font-mono">No hay estudiantes</h3>
            <p className="text-gray-500 mb-6">Comienza agregando tu primer alumno al curso.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all font-display focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              Agrega tu primer alumno
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        student={profileStudent}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileStudent(null);
        }}
      />
    </div>
  );
};

export default Students;
