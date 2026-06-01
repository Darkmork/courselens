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
              onClick={onClose}
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
  );
};

export default AddStudentModal;
