import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FormResponse, FormType } from '../types/FormResponse';

interface UseFormResponsesReturn {
  formResponses: FormResponse[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to form responses for a specific student.
 *
 * @param studentId - The student ID to fetch form responses for
 * @param formType - Optional form type to filter by (inicio_III_medio, fin_I_semestre, inicio_IV_medio, etc.)
 * @returns Object containing:
 *   - formResponses: Array of FormResponse objects
 *   - loading: Boolean indicating if data is being fetched
 *   - error: Error object if fetch failed
 */
export function useFormResponses(studentId: string, formType?: FormType): UseFormResponsesReturn {
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId) {
      setFormResponses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const formResponsesRef = collection(db, 'students', studentId, 'formResponses');
    const formResponsesQuery = formType
      ? query(formResponsesRef, where('formType', '==', formType))
      : query(formResponsesRef);

    const unsubscribe = onSnapshot(
      formResponsesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const responses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as FormResponse));
        setFormResponses(responses);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading form responses:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId, formType]);

  return { formResponses, loading, error };
}