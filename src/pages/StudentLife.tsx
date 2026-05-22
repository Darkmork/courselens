import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { StudentJourney } from '../components/StudentJourney';
import { DigitalBook } from '../components/DigitalBook';
import type { FormResponse } from '../types/FormResponse';
import type { Page } from '../App';

interface StudentLifeProps {
  onNavigate?: (page: Page) => void;
  studentId?: string;
}

export const StudentLife: React.FC<StudentLifeProps> = ({ onNavigate, studentId = 'student-1' }) => {
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
        // Load student data (mock for now)
        setStudentData({
          id: studentId,
          name: 'Estudiante Destacado',
          email: 'student@example.com',
        });

        // In production, fetch from API
        // const response = await fetch(`/api/students/${studentId}/forms`);
        // const data = await response.json();
        // setFormResponses(data);

        setFormResponses([]);
      } catch (error) {
        console.error('Error loading student data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-neutral-400">Cargando perfil del estudiante...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-[#111111] p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate?.('students')}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <p className="text-neutral-400 text-center py-12">
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
    <div className="min-h-screen bg-[#111111] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <button
          onClick={() => onNavigate?.('students')}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Estudiantes
        </button>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setShowBook(false)}
            className={`px-4 py-3 font-bold transition-colors ${
              !showBook
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Viaje del Estudiante
          </button>
          <button
            onClick={() => setShowBook(true)}
            className={`px-4 py-3 font-bold transition-colors ${
              showBook
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
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
