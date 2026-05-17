import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  BrainCircuit,
  MessageSquare,
  UserPlus,
  Upload,
  Download,
  Mail
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, RiskStatus, RelationalRole } from '../types';
import { downloadTemplate, parseFile } from '../utils/csvHelpers';
import Markdown from 'react-markdown';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStudent = {
      name: formData.get('name') as string,
      rut: formData.get('rut') as string,
      courseId: 'default-course',
      riskStatus: RiskStatus.GREEN,
      relationalRole: RelationalRole.HEALTHY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsedData = await parseFile(file);
      
      let importedCount = 0;
      for (const row of parsedData) {
        if (!row['Nombre'] || !row['RUT']) continue;

        const newStudent = {
          name: row['Nombre'],
          rut: row['RUT'],
          dateOfBirth: row['Fecha de Nacimiento'] || '',
          email: row['Email'] || '',
          phone: row['Teléfono'] || '',
          address: row['Dirección'] || '',
          guardian1Name: row['Nombre Apoderado 1'] || '',
          guardian1Relation: row['Parentesco Apo. 1'] || '',
          guardian1Email: row['Email Apo. 1'] || '',
          guardian1Phone: row['Teléfono Apo. 1'] || '',
          guardian2Name: row['Nombre Apoderado 2'] || '',
          guardian2Relation: row['Parentesco Apo. 2'] || '',
          guardian2Email: row['Email Apo. 2'] || '',
          guardian2Phone: row['Teléfono Apo. 2'] || '',
          familySituation: row['Situación Familiar'] || '',
          externalSupport: row['Apoyo Externo'] || '',
          medicalAlerts: row['Alertas Médicas'] || '',
          courseId: 'default-course',
          riskStatus: RiskStatus.GREEN,
          relationalRole: RelationalRole.HEALTHY,
        };

        await addDoc(collection(db, 'students'), {
          ...newStudent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        importedCount++;
      }
      
      alert(`Importación completada. Se importaron ${importedCount} estudiantes.`);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al importar archivo. Verifica el formato e intenta nuevamente.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSummary = async (student: Student) => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const response = await fetch('/api/ai/summarize-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: student })
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('AI summary error:', error);
      alert('Error generando el resumen.');
    } finally {
      setIsSummarizing(false);
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
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight text-sans">Directorio de Alumnos</h2>
          <p className="text-neutral-400">Gestiona perfiles, seguimiento e intervenciones.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-6 py-3 bg-[#111111] border border-white/10 rounded-2xl font-bold text-neutral-300 hover:bg-[#1a1a1a] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Importar
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-12 pr-4 py-3 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-white placeholder:text-neutral-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-[#111111] border border-white/10 rounded-2xl font-bold text-neutral-300 hover:bg-[#1a1a1a] flex items-center justify-center gap-2 transition-all shadow-sm">
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-sm hover:shadow-md hover:border-white/20 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl -mr-16 -mt-16 rounded-full ${
              student.riskStatus === RiskStatus.RED ? 'bg-red-500' : 
              student.riskStatus === RiskStatus.YELLOW ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-16 w-16 bg-[#1a1a1a] border-2 border-white/10 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden text-2xl font-bold text-neutral-400">
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
              <button onClick={() => setSelectedStudent(student)} className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase font-display text-left">
                {student.name}
              </button>
              <p className="text-xs text-neutral-500 font-mono tracking-tighter">RUT: {student.rut}</p>
              {student.guardian1Name && <p className="text-xs text-neutral-400 mt-2 truncate">Apoderado: {student.guardian1Name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button 
                onClick={() => analyzeRisk(student)}
                disabled={isAnalyzing === student.id}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-500/20 transition-colors disabled:opacity-50 border border-blue-500/20"
              >
                {isAnalyzing === student.id ? '...' : <BrainCircuit className="w-4 h-4" />}
                {isAnalyzing === student.id ? 'Analizando' : 'Evaluar IA'}
              </button>
              <button 
                onClick={() => setSelectedStudent(student)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-neutral-300 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors border border-white/5"
              >
                <UserPlus className="w-4 h-4" />
                Ver Detalle & Contacto
              </button>
            </div>

            <button className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center bg-[#111111]/50 rounded-3xl border-2 border-dashed border-white/10">
            <UserPlus className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-widest font-mono">No hay estudiantes</h3>
            <p className="text-neutral-500 mb-6">Comienza agregando tu primer alumno al curso.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all font-display focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050505]"
            >
              Agrega tu primer alumno
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 font-display">Registrar Estudiante</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">Nombre Completo</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  placeholder="Ej. Martín González"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1 font-mono uppercase tracking-wider">RUT</label>
                <input 
                  name="rut"
                  type="text" 
                  required
                  placeholder="Ej. 12.345.678-9"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-2 font-display">Importar Alumnos</h3>
            <p className="text-neutral-400 mb-6 text-sm">Sube un archivo CSV o Excel con los datos de tus estudiantes. Puedes descargar la plantilla para ver el formato requerido.</p>
            
            <div className="space-y-4">
              <button 
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] text-blue-400 rounded-2xl font-bold hover:bg-[#1a1a1a] transition-all border border-blue-500/20"
              >
                <Download className="w-5 h-5" />
                Descargar Plantilla
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isImporting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                />
                <button 
                  disabled={isImporting}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-6 ${isImporting ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]'} rounded-2xl font-bold transition-all`}
                >
                  <Upload className="w-5 h-5" />
                  {isImporting ? 'Importando...' : 'Subir Archivo'}
                </button>
              </div>

              <div className="pt-4">
                <button 
                  type="button" 
                  disabled={isImporting}
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Student / AI Summary Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 mt-10 mb-10 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-all"
            >
              Cerrar
            </button>
            
            <h3 className="text-3xl font-bold text-white mb-2 font-display">{selectedStudent.name}</h3>
            <p className="text-neutral-400 font-mono text-sm mb-6">RUT: {selectedStudent.rut}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 text-sm">
                <h4 className="text-blue-400 font-bold mb-3 uppercase tracking-wider font-mono text-xs">Contacto Familia</h4>
                {selectedStudent.guardian1Name ? (
                  <div className="space-y-2">
                    <p className="text-white"><span className="text-neutral-500">{selectedStudent.guardian1Relation || 'Apo. 1'}:</span> {selectedStudent.guardian1Name}</p>
                    <p className="text-neutral-300">{selectedStudent.guardian1Phone}</p>
                    <button 
                      onClick={() => handleEmailParent(selectedStudent.guardian1Email, selectedStudent.name)}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mt-1"
                    >
                      <Mail className="w-4 h-4" /> {selectedStudent.guardian1Email || 'Sin email'}
                    </button>
                  </div>
                ) : (
                  <p className="text-neutral-500 italic">No hay información del apoderado 1</p>
                )}
                
                {selectedStudent.guardian2Name && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                    <p className="text-white"><span className="text-neutral-500">{selectedStudent.guardian2Relation || 'Apo. 2'}:</span> {selectedStudent.guardian2Name}</p>
                    <p className="text-neutral-300">{selectedStudent.guardian2Phone}</p>
                    <button 
                      onClick={() => handleEmailParent(selectedStudent.guardian2Email, selectedStudent.name)}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mt-1"
                    >
                      <Mail className="w-4 h-4" /> {selectedStudent.guardian2Email || 'Sin email'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 text-sm space-y-3">
                <h4 className="text-blue-400 font-bold mb-3 uppercase tracking-wider font-mono text-xs">Información Adicional</h4>
                <p className="text-neutral-300"><span className="text-neutral-500">Apoyo Externo:</span> {selectedStudent.externalSupport || 'Ninguno'}</p>
                <p className="text-neutral-300"><span className="text-neutral-500">Alertas Médicas:</span> {selectedStudent.medicalAlerts || 'Ninguna'}</p>
                <p className="text-neutral-300"><span className="text-neutral-500">Situación Familiar:</span> {selectedStudent.familySituation || 'No especificada'}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-3xl border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center gap-2 text-lg font-bold text-white">
                  <BrainCircuit className="text-blue-400" />
                  Asistente IA para Entrevistas
                </h4>
                <button 
                  onClick={() => generateSummary(selectedStudent)}
                  disabled={isSummarizing}
                  className={`px-4 py-2 ${isSummarizing ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'} rounded-xl font-bold transition-all text-sm`}
                >
                  {isSummarizing ? 'Generando...' : (summary ? 'Regenerar Resumen' : 'Generar Resumen')}
                </button>
              </div>
              
              {summary && (
                <div className="mt-6 p-6 bg-black/40 rounded-2xl border border-white/10 prose prose-invert prose-blue max-w-none text-sm md:text-base leading-relaxed">
                  <div className="markdown-body">
                    <Markdown>{summary}</Markdown>
                  </div>
                </div>
              )}
              
              {!summary && !isSummarizing && (
                <p className="text-neutral-400 text-sm italic">Genera un resumen analítico con la IA basándose en los datos del estudiante para prepararte para tu próxima reunión con los apoderados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
