import React from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RiskStatus, RelationalRole } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
      onClose();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="bg-white border border-gray-200 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">Registrar Estudiante</h3>
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">Nombre Completo</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej. Martín González"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1 font-mono uppercase tracking-wider">RUT</label>
            <input
              name="rut"
              type="text"
              required
              placeholder="Ej. 12.345.678-9"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
