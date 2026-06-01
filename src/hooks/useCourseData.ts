import { useState, useEffect } from 'react';
import { collection, doc, query, onSnapshot, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, SociogramData } from '../types';
import type { FormResponse, FormType } from '../types/FormResponse';

interface CourseStats {
  formResponsesCount: number;
  momentsCaptured: FormType[];
  cohesionScore: number | undefined;
  leadershipScore: number | undefined;
  emotionalWellness: number | undefined;
  totalStudents: number;
}

interface UseCourseDataReturn {
  course: Course | null;
  students: Array<{ id: string; name: string; riskStatus: string; cohortGroup: string }>;
  stats: CourseStats;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching course data with computed statistics.
 * Combines course info, student list, sociogram metrics, and form response stats.
 *
 * @param courseId - The course ID to fetch data for
 * @param year - Optional year for sociogram data (defaults to current year)
 */
export function useCourseData(courseId: string, year?: number): UseCourseDataReturn {
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; name: string; riskStatus: string; cohortGroup: string }>>([]);
  const [stats, setStats] = useState<CourseStats>({
    formResponsesCount: 0,
    momentsCaptured: [],
    cohesionScore: undefined,
    leadershipScore: undefined,
    emotionalWellness: undefined,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentYear = year || new Date().getFullYear();

  // Fetch course data
  useEffect(() => {
    const coursesUnsubscribe = onSnapshot(
      collection(db, 'courses'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const courseDoc = snapshot.docs.find(doc => doc.id === courseId);
        if (courseDoc) {
          setCourse({
            id: courseDoc.id,
            ...courseDoc.data(),
          } as Course);
        } else {
          // Fallback if course not found - create minimal course object
          setCourse({
            id: courseId,
            name: courseId,
            year: currentYear,
            teacherId: '',
            healthScores: { academic: 0, relational: 0, emotional: 0, spiritual: 0 },
            createdAt: new Date().toISOString(),
          });
        }
      },
      (err) => {
        console.error('Error loading course:', err);
        setError(err);
      }
    );

    return () => coursesUnsubscribe();
  }, [courseId, currentYear]);

  // Fetch students for this course
  useEffect(() => {
    const studentsQuery = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const studentList = snapshot.docs
          .filter(doc => doc.data().courseId === courseId)
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Estudiante',
            riskStatus: doc.data().riskStatus || 'Verde',
            cohortGroup: doc.data().cohortGroup || 'Sin grupo',
          }));
        setStudents(studentList);
      },
      (err) => {
        console.error('Error loading students:', err);
      }
    );

    return () => unsubscribe();
  }, [courseId]);

  // Compute form response stats from students
  useEffect(() => {
    if (students.length === 0) return;

    let totalFormResponses = 0;
    const formTypesSet = new Set<FormType>();
    let totalEmotionalWellness = 0;
    let emotionalCount = 0;

    const fetchFormResponses = async () => {
      for (const student of students) {
        try {
          const formResponsesRef = collection(db, 'students', student.id, 'formResponses');
          const formResponsesSnap = await getDocs(formResponsesRef);
          totalFormResponses += formResponsesSnap.size;

          formResponsesSnap.forEach(formDoc => {
            const data = formDoc.data() as FormResponse;
            if (data.formType) {
              formTypesSet.add(data.formType);
            }
            if (data.responses?.emotional?.bienestar) {
              const wellbeing = data.responses.emotional.bienestar;
              const match = wellbeing.match(/(\d+)/);
              if (match) {
                totalEmotionalWellness += parseInt(match[1], 10);
                emotionalCount++;
              }
            }
          });
        } catch (err) {
          console.error(`Error fetching form responses for student ${student.id}:`, err);
        }
      }

      const momentsArray = Array.from(formTypesSet);
      const avgEmotionalWellness = emotionalCount > 0 ? totalEmotionalWellness / emotionalCount : undefined;

      setStats(prev => ({
        ...prev,
        formResponsesCount: totalFormResponses,
        momentsCaptured: momentsArray,
        emotionalWellness: avgEmotionalWellness,
        totalStudents: students.length,
      }));
    };

    fetchFormResponses();
  }, [students]);

  // Fetch sociogram data for cohesion and leadership scores
  useEffect(() => {
    const sociogramCollection = `sociogram_${currentYear}`;

    const unsubscribe = onSnapshot(
      doc(db, sociogramCollection, courseId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SociogramData;
          setStats(prev => ({
            ...prev,
            cohesionScore: data.metricas?.cohesion,
            leadershipScore: data.metricas?.liderazgo_promedio,
          }));
        }
      },
      (err) => {
        console.error('Error loading sociogram data:', err);
      }
    );

    return () => unsubscribe();
  }, [courseId, currentYear]);

  // Update loading state when course and students are loaded
  useEffect(() => {
    if (course !== null || error !== null) {
      setLoading(false);
    }
  }, [course, error]);

  return { course, students, stats, loading, error };
}