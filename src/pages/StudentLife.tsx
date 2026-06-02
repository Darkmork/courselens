import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StudentJourney } from '../components/StudentJourney';
import { DigitalBook } from '../components/DigitalBook';
import type { FormResponse } from '../types/FormResponse';
import { DEFAULT_STUDENT_ID } from '../lib/constants';
import type { Page } from '../App';

interface StudentLifeProps {
  onNavigate?: (page: Page) => void;
  studentId?: string;
}

export const StudentLife: React.FC<StudentLifeProps> = ({ onNavigate, studentId = DEFAULT_STUDENT_ID }) => {
  const [studentData, setStudentData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load student data from Firestore
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          setStudentData({
            id: studentId,
            name: studentDoc.data().name || 'Estudiante',
            email: studentDoc.data().email || '',
          });
        } else {
          setStudentData(null);
          setLoading(false);
          return;
        }

        // Load form responses from Firestore sub-collection
        const unsubscribe = onSnapshot(
          collection(db, 'students', studentId, 'formResponses'),
          (snapshot) => {
            const responses: FormResponse[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data() as FormResponse,
            }));
            setFormResponses(responses);
            setLoading(false);
          },
          (error) => {
            console.error('Error loading form responses:', error);
            setFormResponses([]);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading student data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500">Cargando perfil del estudiante...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate?.('students')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <p className="text-gray-500 text-center py-12">
            No se encontraron datos para este estudiante
          </p>
        </div>
      </div>
    );
  }

  const bookContent = `
    <h2>Resumen de Crecimiento</h2>
    <p>Este documento captura el viaje de ${studentData.name} a lo largo del año académico, desde sus primeras reflexiones hasta sus metas futuras.</p>

    <h2>Momentos Clave</h2>
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-marker">1</div>
        <div class="timeline-content">
          <h3>Diagnóstico Inicial (Marzo)</h3>
          <p>Primer encuentro con las preguntas que guiarían el año: "¿Quién soy? ¿Cuáles son mis fortalezas? ¿Qué quiero ser?"</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-marker">2</div>
        <div class="timeline-content">
          <h3>Checkpoint (Junio)</h3>
          <p>Reflexión sobre los primeros cambios, descubrimientos inesperados, y cómo ha evolucionado su perspectiva.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-marker">3</div>
        <div class="timeline-content">
          <h3>Consolidación (Septiembre)</h3>
          <p>Cierre del viaje: claridad vocacional, red relacional más sólida, y comprensión más profunda de sí mismo.</p>
        </div>
      </div>
    </div>

    <div class="highlight">
      "El crecimiento no es una línea recta. Es un proceso de descubrimiento, ajuste, y finalmente, integración."
    </div>

    <h2>Reflexión Final</h2>
    <p>
      ${studentData.name} ha completado un ciclo transformador. Los datos capturados en estos formularios no son simples respuestas,
      sino huellas de su evolución como estudiante y como persona. Este registro será un recordatorio permanente de quién era,
      cómo creció, y hacia dónde se dirige.
    </p>
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <button
          onClick={() => onNavigate?.('students')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Estudiantes
        </button>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setShowBook(false)}
            className={`px-4 py-3 font-bold transition-colors ${
              !showBook
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Viaje del Estudiante
          </button>
          <button
            onClick={() => setShowBook(true)}
            className={`px-4 py-3 font-bold transition-colors ${
              showBook
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Libro Digital
          </button>
        </div>

        {/* Content */}
        {!showBook ? (
          <StudentJourney
            studentId={studentData.id}
            studentName={studentData.name}
            formResponses={formResponses}
            onExport={() => setShowBook(true)}
          />
        ) : (
          <DigitalBook
            courseName="Perfil Individual"
            courseYear={new Date().getFullYear()}
            studentName={studentData.name}
            content={bookContent}
            type="student"
          />
        )}
      </div>
    </div>
  );
};

export default StudentLife;
