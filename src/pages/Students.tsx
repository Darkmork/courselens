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
  Mail,
  Camera,
  X,
  Save
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Student, RiskStatus, RelationalRole, Category, Observation } from '../types';
import { downloadTemplate, parseFile } from '../utils/csvHelpers';
import Markdown from 'react-markdown';
import StudentGrowthTimeline from '../components/StudentGrowthTimeline';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academico' | 'familia' | 'salud' | 'crecimiento'>('personal');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profileStudent) {
      setObservations([]);
      return;
    }
    const q = query(collection(db, 'observations'), where('studentId', '==', profileStudent.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setObservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Observation)));
    });
    return () => unsubscribe();
  }, [profileStudent]);

  const openProfileModal = (student: Student) => {
    setProfileStudent(student);
    setActiveTab('personal');
    setSummary(null);
    setIsProfileModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileStudent) return;

    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `students/${profileStudent.id}/photo`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);

      const studentRef = doc(db, 'students', profileStudent.id);
      await updateDoc(studentRef, { photoUrl });

      setProfileStudent(prev => prev ? { ...prev, photoUrl } : null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileStudent) return;

    setIsSavingProfile(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = Object.fromEntries(
        Array.from(formData.entries()).filter(([, value]) => value !== '' && value !== undefined)
      );

      const studentRef = doc(db, 'students', profileStudent.id);
      await updateDoc(studentRef, updates);

      setProfileStudent(prev => prev ? { ...prev, ...updates } : null);
      alert('Perfil guardado exitosamente.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddObservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileStudent) return;

    setIsAddingObservation(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newObservation = {
        studentId: profileStudent.id,
        courseId: profileStudent.courseId,
        text: formData.get('text') as string,
        category: formData.get('category') as Category,
        date: new Date().toISOString(),
      };

      await addDoc(collection(db, 'observations'), newObservation);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding observation:', error);
      alert('Error al agregar la observación.');
    } finally {
      setIsAddingObservation(false);
    }
  };

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
        const nombre = row['Nombre']?.toString().trim();
        const rut = row['RUT']?.toString().trim();

        if (!nombre || !rut) continue;

        const newStudent = {
          name: nombre,
          rut: rut,
          dateOfBirth: (row['Fecha de Nacimiento'] || '').toString().trim(),
          email: (row['Email'] || '').toString().trim(),
          phone: (row['Teléfono'] || '').toString().trim(),
          address: (row['Dirección'] || '').toString().trim(),
          guardian1Name: (row['Nombre Apoderado 1'] || '').toString().trim(),
          guardian1Relation: (row['Parentesco Apo. 1'] || '').toString().trim(),
          guardian1Email: (row['Email Apo. 1'] || '').toString().trim(),
          guardian1Phone: (row['Teléfono Apo. 1'] || '').toString().trim(),
          guardian2Name: (row['Nombre Apoderado 2'] || '').toString().trim(),
          guardian2Relation: (row['Parentesco Apo. 2'] || '').toString().trim(),
          guardian2Email: (row['Email Apo. 2'] || '').toString().trim(),
          guardian2Phone: (row['Teléfono Apo. 2'] || '').toString().trim(),
          familySituation: (row['Situación Familiar'] || '').toString().trim(),
          externalSupport: (row['Apoyo Externo'] || '').toString().trim(),
          medicalAlerts: (row['Alertas Médicas'] || '').toString().trim(),
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
              <button onClick={() => openProfileModal(student)} className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase font-display text-left">
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
                onClick={() => openProfileModal(student)}
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

      {/* Profile Editor Modal */}
      {isProfileModalOpen && profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 mt-10 mb-10 max-h-[90vh] overflow-y-auto relative flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-[#1a1a1a] border-2 border-white/10 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden text-2xl font-bold text-neutral-400 relative group cursor-pointer">
                  {profileStudent.photoUrl ? <img src={profileStudent.photoUrl} alt="" className="w-full h-full object-cover" /> : profileStudent.name[0]}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-display">{profileStudent.name}</h2>
                  <p className="text-neutral-400 font-mono text-sm">RUT: {profileStudent.rut}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 px-6 pt-6 border-b border-white/10">
              {(['personal', 'academico', 'familia', 'salud', 'crecimiento'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-bold rounded-t-2xl transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  {tab === 'personal' && 'Personal'}
                  {tab === 'academico' && 'Académico'}
                  {tab === 'familia' && 'Familia'}
                  {tab === 'salud' && 'Salud'}
                  {tab === 'crecimiento' && '📊 Crecimiento'}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveProfile} className="flex-1 p-6 overflow-y-auto space-y-4">
              {activeTab === 'personal' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Nombre</label>
                      <input type="text" name="name" defaultValue={profileStudent.name} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">RUT</label>
                      <input type="text" name="rut" defaultValue={profileStudent.rut} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Fecha de Nacimiento</label>
                      <input type="date" name="dateOfBirth" defaultValue={profileStudent.dateOfBirth || ''} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Email</label>
                      <input type="email" name="email" defaultValue={profileStudent.email || ''} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Teléfono</label>
                      <input type="tel" name="phone" defaultValue={profileStudent.phone || ''} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Dirección</label>
                      <input type="text" name="address" defaultValue={profileStudent.address || ''} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'academico' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Desempeño Académico</label>
                      <select name="academicPerformance" defaultValue={profileStudent.academicPerformance || ''} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white">
                        <option value="">Seleccionar...</option>
                        <option value="Muy Alto">Muy Alto</option>
                        <option value="Alto">Alto</option>
                        <option value="Promedio">Promedio</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Muy Bajo">Muy Bajo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Estado de Riesgo</label>
                      <select name="riskStatus" defaultValue={profileStudent.riskStatus} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white">
                        <option value="Verde">Verde</option>
                        <option value="Amarillo">Amarillo</option>
                        <option value="Rojo">Rojo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Notas Académicas</label>
                    <textarea name="academicNotes" defaultValue={profileStudent.academicNotes || ''} rows={3} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Notas de Comportamiento</label>
                    <textarea name="behaviorNotes" defaultValue={profileStudent.behaviorNotes || ''} rows={3} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                </>
              )}

              {activeTab === 'familia' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Situación Familiar</label>
                    <textarea name="familySituation" defaultValue={profileStudent.familySituation || ''} rows={2} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold text-white mb-4">Apoderado 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" name="guardian1Name" defaultValue={profileStudent.guardian1Name || ''} placeholder="Nombre" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="text" name="guardian1Relation" defaultValue={profileStudent.guardian1Relation || ''} placeholder="Relación (Padre, Madre, etc.)" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="email" name="guardian1Email" defaultValue={profileStudent.guardian1Email || ''} placeholder="Email" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="tel" name="guardian1Phone" defaultValue={profileStudent.guardian1Phone || ''} placeholder="Teléfono" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold text-white mb-4">Apoderado 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" name="guardian2Name" defaultValue={profileStudent.guardian2Name || ''} placeholder="Nombre" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="text" name="guardian2Relation" defaultValue={profileStudent.guardian2Relation || ''} placeholder="Relación (Padre, Madre, etc.)" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="email" name="guardian2Email" defaultValue={profileStudent.guardian2Email || ''} placeholder="Email" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                      <input type="tel" name="guardian2Phone" defaultValue={profileStudent.guardian2Phone || ''} placeholder="Teléfono" className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-neutral-600" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'salud' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Diagnóstico</label>
                    <textarea name="diagnosis" defaultValue={profileStudent.diagnosis || ''} rows={2} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Alertas Médicas</label>
                    <textarea name="medicalAlerts" defaultValue={profileStudent.medicalAlerts || ''} rows={2} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Apoyo Externo</label>
                    <textarea name="externalSupport" defaultValue={profileStudent.externalSupport || ''} rows={2} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Medidas Disciplinarias</label>
                    <textarea name="disciplinaryMeasures" defaultValue={profileStudent.disciplinaryMeasures || ''} rows={2} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white resize-none" />
                  </div>
                </>
              )}

              {activeTab === 'crecimiento' && (
                <StudentGrowthTimeline studentId={profileStudent.id} />
              )}

              {/* Sticky Save Button */}
              {activeTab !== 'crecimiento' && (
                <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-white/10 pt-4 mt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold transition-all ${
                      isSavingProfile
                        ? 'bg-neutral-800 text-neutral-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    }`}
                  >
                    <Save className="w-5 h-5" />
                    {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </form>

            {/* Observations Section */}
            {activeTab !== 'crecimiento' && (
            <div className="border-t border-white/10 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Observaciones
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {observations.map(obs => (
                  <div key={obs.id} className="bg-[#111111] p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{obs.category}</span>
                      <span className="text-xs text-neutral-500">{new Date(obs.date).toLocaleDateString('es-CL')}</span>
                    </div>
                    <p className="text-neutral-300 text-sm">{obs.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddObservation} className="space-y-3 bg-[#111111] p-4 rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select name="category" required className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-xl text-white text-sm">
                    <option value="">Categoría...</option>
                    <option value="Académica">Académica</option>
                    <option value="Conductual">Conductual</option>
                    <option value="Relacional">Relacional</option>
                    <option value="Emocional">Emocional</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isAddingObservation}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      isAddingObservation
                        ? 'bg-neutral-800 text-neutral-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                <textarea name="text" required placeholder="Nueva observación..." rows={2} className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-xl text-white text-sm resize-none placeholder:text-neutral-600" />
              </form>
            </div>
            )}

            {/* AI Summary Section */}
            <div className="border-t border-white/10 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center gap-2 text-lg font-bold text-white">
                  <BrainCircuit className="text-blue-400" />
                  Asistente IA para Entrevistas
                </h4>
                <button
                  onClick={() => generateSummary(profileStudent)}
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
