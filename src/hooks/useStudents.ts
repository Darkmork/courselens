import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';

/**
 * Custom hook for subscribing to students collection.
 *
 * @param courseId - Optional course ID to filter students by
 * @returns Object containing:
 *   - students: Array of Student objects
 *   - loading: Boolean indicating if data is being fetched
 *   - error: Error object if fetch failed
 */
export function useStudents(courseId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const studentsQuery = courseId
      ? query(collection(db, 'students'))
      : query(collection(db, 'students'));

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        let studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Student));

        // Filter by courseId if provided
        if (courseId) {
          studentList = studentList.filter(s => s.courseId === courseId);
        }

        setStudents(studentList);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading students:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [courseId]);

  return { students, loading, error };
}