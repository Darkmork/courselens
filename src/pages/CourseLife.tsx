import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CourseNarrative } from '../components/CourseNarrative';
import { DigitalBook } from '../components/DigitalBook';
import { DEFAULT_COURSE_ID } from '../lib/constants';
import type { Page } from '../App';
import type { FormResponse } from '../types/FormResponse';
import type { SociogramData } from '../types';

interface CourseLifeProps {
  onNavigate?: (page: Page) => void;
  courseId?: string;
}

export const CourseLife: React.FC<CourseLifeProps> = ({
  onNavigate,
  courseId = DEFAULT_COURSE_ID,
}) => {
  const [courseData, setCourseData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [stats, setStats] = useState({
    formResponsesCount: 0,
    momentsCaptured: [] as string[],
    cohesionScore: undefined as number | undefined,
    leadershipScore: undefined as number | undefined,
    emotionalWellness: undefined as number | undefined,
  });

  // Compute stats from Firestore data
  useEffect(() => {
    if (students.length === 0) return;

    let totalFormResponses = 0;
    const formTypesSet = new Set<string>();
    let totalEmotionalWellness = 0;
    let emotionalCount = 0;

    const fetchFormResponses = async () => {
      for (const student of students) {
        try {
          const formResponsesRef = collection(db, 'students', student.id, 'formResponses');
          const formResponsesSnap = await getDocs(formResponsesRef);
          totalFormResponses += formResponsesSnap.size;

          formResponsesSnap.forEach(doc => {
            const data = doc.data() as FormResponse;
            if (data.formType) {
              formTypesSet.add(data.formType);
            }
            if (data.responses?.emotional?.bienestar) {
              // Parse emotional wellness from text (e.g., "7/10" or "Bien")
              const wellbeing = data.responses.emotional.bienestar;
              const match = wellbeing.match(/(\d+)/);
              if (match) {
                totalEmotionalWellness += parseInt(match[1], 10);
                emotionalCount++;
              }
            }
          });
        } catch (error) {
          console.error(`Error fetching form responses for student ${student.id}:`, error);
        }
      }

      const momentsArray = Array.from(formTypesSet);
      const avgEmotionalWellness = emotionalCount > 0 ? totalEmotionalWellness / emotionalCount : undefined;

      setStats(prev => ({
        ...prev,
        formResponsesCount: totalFormResponses,
        momentsCaptured: momentsArray,
        emotionalWellness: avgEmotionalWellness,
      }));
    };

    fetchFormResponses();
  }, [students]);

  // Fetch sociogram data for cohesion and leadership scores
  useEffect(() => {
    if (!courseData?.year) return;

    const sociogramCollection = `sociogram_${courseData.year}`;
    const unsubscribe = onSnapshot(
      collection(db, sociogramCollection),
      (snapshot) => {
        const courseSociogram = snapshot.docs.find(doc => doc.id === courseId);
        if (courseSociogram) {
          const data = courseSociogram.data() as SociogramData;
          setStats(prev => ({
            ...prev,
            cohesionScore: data.metricas?.cohesion,
            leadershipScore: data.metricas?.liderazgo_promedio,
          }));
        }
      },
      (error) => {
        console.error('Error loading sociogram data:', error);
      }
    );

    return () => unsubscribe();
  }, [courseId, courseData?.year]);

  useEffect(() => {
    setLoading(true);

    // Load students from Firestore
    const q = query(collection(db, 'students'), where('courseId', '==', courseId));
    const studentsUnsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Estudiante',
        riskStatus: doc.data().riskStatus || 'Verde',
        cohortGroup: doc.data().cohortGroup || 'Sin grupo',
      }));
      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading students:', error);
      setLoading(false);
    });

    // Load course data from Firestore
    const coursesUnsubscribe = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const course = snapshot.docs.find(doc => doc.id === courseId);
      if (course) {
        setCourseData({
          id: course.id,
          name: course.data().name || courseId,
          year: course.data().year || new Date().getFullYear(),
        });
      } else {
        // Fallback if course not found
        setCourseData({
          id: courseId,
          name: courseId,
          year: new Date().getFullYear(),
        });
      }
    }, (error) => {
      console.error('Error loading course:', error);
      // Fallback
      setCourseData({
        id: courseId,
        name: courseId,
        year: new Date().getFullYear(),
      });
    });

    return () => {
      studentsUnsubscribe();
      coursesUnsubscribe();
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500">Cargando datos del curso...</p>
        </div>
      </div>
    );
  }

  const bookContent = `<h2>La Historia de ${courseData?.name || 'Curso'}</h2>`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>

        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setShowBook(false)}
            className={`px-4 py-3 font-bold transition-colors ${
              !showBook
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Narrativa del Curso
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

        {!showBook && courseData ? (
          <CourseNarrative
            courseId={courseData.id}
            courseName={courseData.name}
            students={students}
            stats={{
              totalStudents: students.length,
              formResponsesCount: stats.formResponsesCount,
              momentsCaptured: stats.momentsCaptured,
              cohesionScore: stats.cohesionScore,
              leadershipScore: stats.leadershipScore,
              emotionalWellness: stats.emotionalWellness,
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
