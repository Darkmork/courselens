import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Save,
  MessageSquare,
  Plus,
  BrainCircuit,
  Upload,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, where } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Student, Category, Observation, RiskStatus } from '../types';
import StudentGrowthTimeline from './StudentGrowthTimeline';
import Markdown from 'react-markdown';

interface StudentProfileModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onStudentUpdate?: (student: Student) => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  student,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'academico' | 'familia' | 'salud' | 'crecimiento'>('personal');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(student);

  useEffect(() => {
    setProfileStudent(student);
  }, [student]);

  useEffect(() => {
    if (!profileStudent) {
      setObservations([]);
      setSummary(null);
      return;
    }
    const q = query(collection(db, 'observations'), where('studentId', '==', profileStudent.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setObservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Observation)));
    });
    return () => unsubscribe();
  }, [profileStudent?.id]);

  if (!isOpen || !profileStudent) return null;

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

      setProfileStudent(prev => prev ? { ...prev, ...updates } as Student : null);
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

  const generateSummary = async () => {
    if (!profileStudent) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const response = await fetch('/api/ai/summarize-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: profileStudent })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-gray-200 w-full max-w-3xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 mt-10 mb-10 max-h-[90vh] overflow-y-auto relative flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden text-2xl font-bold text-gray-400 relative group cursor-pointer">
              {profileStudent.photoUrl ? <img src={profileStudent.photoUrl} alt="" className="w-full h-full object-cover" /> : profileStudent.name[0]}
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
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
              <h2 className="text-2xl font-bold text-gray-900 font-display">{profileStudent.name}</h2>
              <p className="text-gray-500 font-mono text-sm">RUT: {profileStudent.rut}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 hover:text-gray-700 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 px-6 pt-6 border-b border-gray-200">
          {(['personal', 'academico', 'familia', 'salud', 'crecimiento'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold rounded-t-2xl transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700'
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
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Nombre</label>
                  <input type="text" name="name" defaultValue={profileStudent.name} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">RUT</label>
                  <input type="text" name="rut" defaultValue={profileStudent.rut} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Fecha de Nacimiento</label>
                  <input type="date" name="dateOfBirth" defaultValue={profileStudent.dateOfBirth || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Email</label>
                  <input type="email" name="email" defaultValue={profileStudent.email || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Teléfono</label>
                  <input type="tel" name="phone" defaultValue={profileStudent.phone || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Dirección</label>
                  <input type="text" name="address" defaultValue={profileStudent.address || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'academico' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Desempeño Académico</label>
                  <select name="academicPerformance" defaultValue={profileStudent.academicPerformance || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900">
                    <option value="">Seleccionar...</option>
                    <option value="Muy Alto">Muy Alto</option>
                    <option value="Alto">Alto</option>
                    <option value="Promedio">Promedio</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Muy Bajo">Muy Bajo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Estado de Riesgo</label>
                  <select name="riskStatus" defaultValue={profileStudent.riskStatus} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900">
                    <option value="Verde">Verde</option>
                    <option value="Amarillo">Amarillo</option>
                    <option value="Rojo">Rojo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Notas Académicas</label>
                <textarea name="academicNotes" defaultValue={profileStudent.academicNotes || ''} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Notas de Comportamiento</label>
                <textarea name="behaviorNotes" defaultValue={profileStudent.behaviorNotes || ''} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
            </>
          )}

          {activeTab === 'familia' && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Situación Familiar</label>
                <textarea name="familySituation" defaultValue={profileStudent.familySituation || ''} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 mb-4">Apoderado 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="guardian1Name" defaultValue={profileStudent.guardian1Name || ''} placeholder="Nombre" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="text" name="guardian1Relation" defaultValue={profileStudent.guardian1Relation || ''} placeholder="Relación (Padre, Madre, etc.)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="email" name="guardian1Email" defaultValue={profileStudent.guardian1Email || ''} placeholder="Email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="tel" name="guardian1Phone" defaultValue={profileStudent.guardian1Phone || ''} placeholder="Teléfono" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 mb-4">Apoderado 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="guardian2Name" defaultValue={profileStudent.guardian2Name || ''} placeholder="Nombre" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="text" name="guardian2Relation" defaultValue={profileStudent.guardian2Relation || ''} placeholder="Relación (Padre, Madre, etc.)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="email" name="guardian2Email" defaultValue={profileStudent.guardian2Email || ''} placeholder="Email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                  <input type="tel" name="guardian2Phone" defaultValue={profileStudent.guardian2Phone || ''} placeholder="Teléfono" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'salud' && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Diagnóstico</label>
                <textarea name="diagnosis" defaultValue={profileStudent.diagnosis || ''} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Alertas Médicas</label>
                <textarea name="medicalAlerts" defaultValue={profileStudent.medicalAlerts || ''} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Apoyo Externo</label>
                <textarea name="externalSupport" defaultValue={profileStudent.externalSupport || ''} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 font-mono uppercase tracking-wider">Medidas Disciplinarias</label>
                <textarea name="disciplinaryMeasures" defaultValue={profileStudent.disciplinaryMeasures || ''} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 resize-none" />
              </div>
            </>
          )}

          {activeTab === 'crecimiento' && (
            <StudentGrowthTimeline studentId={profileStudent.id} />
          )}

          {/* Sticky Save Button */}
          {activeTab !== 'crecimiento' && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-4 flex gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold transition-all ${
                  isSavingProfile
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
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
          <div className="border-t border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Observaciones
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {observations.map(obs => (
                <div key={obs.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{obs.category}</span>
                    <span className="text-xs text-gray-400">{new Date(obs.date).toLocaleDateString('es-CL')}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{obs.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddObservation} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select name="category" required className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm">
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
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
              <textarea name="text" required placeholder="Nueva observación..." rows={2} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm resize-none placeholder:text-gray-400" />
            </form>
          </div>
        )}

        {/* AI Summary Section */}
        <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <BrainCircuit className="text-blue-500" />
              Asistente IA para Entrevistas
            </h4>
            <button
              onClick={generateSummary}
              disabled={isSummarizing}
              className={`px-4 py-2 ${isSummarizing ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'} rounded-xl font-bold transition-all text-sm`}
            >
              {isSummarizing ? 'Generando...' : (summary ? 'Regenerar Resumen' : 'Generar Resumen')}
            </button>
          </div>

          {summary && (
            <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-200 prose prose-gray max-w-none text-sm md:text-base leading-relaxed">
              <div className="markdown-body">
                <Markdown>{summary}</Markdown>
              </div>
            </div>
          )}

          {!summary && !isSummarizing && (
            <p className="text-gray-500 text-sm italic">Genera un resumen analítico con la IA basándose en los datos del estudiante para prepararte para tu próxima reunión con los apoderados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
