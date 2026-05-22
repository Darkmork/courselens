import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { CourseNarrative } from '../components/CourseNarrative';
import { DigitalBook } from '../components/DigitalBook';
import type { Page } from '../App';

interface CourseLifeProps {
  onNavigate?: (page: Page) => void;
  courseId?: string;
}

export const CourseLife: React.FC<CourseLifeProps> = ({
  onNavigate,
  courseId = 'course-1',
}) => {
  const [courseData, setCourseData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setCourseData({
          id: courseId,
          name: '3° Medio A',
          year: 2024,
        });

        setStudents([
          {
            id: 'student-1',
            name: 'Carlos Mendoza',
            riskStatus: 'Verde',
            cohortGroup: 'Grupo A',
          },
          {
            id: 'student-2',
            name: 'María González',
            riskStatus: 'Verde',
            cohortGroup: 'Grupo B',
          },
          {
            id: 'student-3',
            name: 'Juan Pérez',
            riskStatus: 'Amarillo',
            cohortGroup: 'Grupo A',
          },
        ]);
      } catch (error) {
        console.error('Error loading course data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-neutral-400">Cargando datos del curso...</p>
        </div>
      </div>
    );
  }

  const bookContent = `<h2>La Historia de ${courseData?.name || 'Curso'}</h2>`;

  return (
    <div className="min-h-screen bg-[#111111] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>

        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setShowBook(false)}
            className={`px-4 py-3 font-bold transition-colors ${
              !showBook
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Narrativa del Curso
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

        {!showBook && courseData ? (
          <CourseNarrative
            courseId={courseData.id}
            courseName={courseData.name}
            students={students}
            stats={{
              totalStudents: students.length,
              formResponsesCount: 50,
              momentsCapured: ['inicio_III_medio', 'mediados_III_medio', 'inicio_IV_medio'],
              cohesionScore: 8,
              leadershipScore: 7,
              emotionalWellness: 7.5,
            }}
            onExportBook={() => setShowBook(true)}
          />
        ) : courseData ? (
          <DigitalBook
            courseName={courseData.name}
            courseYear={courseData.year}
            content={bookContent}
            type="course"
          />
        ) : null}
      </div>
    </div>
  );
};

export default CourseLife;
