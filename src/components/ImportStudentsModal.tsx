import React, { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RiskStatus, RelationalRole } from '../types';
import { downloadTemplate, parseFile } from '../utils/csvHelpers';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsedData = await parseFile(file);

      let importedCount = 0;
      for (const row of parsedData) {
        const nombre = row['Nombre']?.toString().trim();
        const rut = row['RUT']?.toString().trim();

        if (!nombre || !rut) continue;

        const newStudent = {
          name: nombre,
          rut: rut,
          dateOfBirth: (row['Fecha de Nacimiento'] || '').toString().trim(),
          email: (row['Email'] || '').toString().trim(),
          phone: (row['Teléfono'] || '').toString().trim(),
          address: (row['Dirección'] || '').toString().trim(),
          guardian1Name: (row['Nombre Apoderado 1'] || '').toString().trim(),
          guardian1Relation: (row['Parentesco Apo. 1'] || '').toString().trim(),
          guardian1Email: (row['Email Apo. 1'] || '').toString().trim(),
          guardian1Phone: (row['Teléfono Apo. 1'] || '').toString().trim(),
          guardian2Name: (row['Nombre Apoderado 2'] || '').toString().trim(),
          guardian2Relation: (row['Parentesco Apo. 2'] || '').toString().trim(),
          guardian2Email: (row['Email Apo. 2'] || '').toString().trim(),
          guardian2Phone: (row['Teléfono Apo. 2'] || '').toString().trim(),
          familySituation: (row['Situación Familiar'] || '').toString().trim(),
          externalSupport: (row['Apoyo Externo'] || '').toString().trim(),
          medicalAlerts: (row['Alertas Médicas'] || '').toString().trim(),
          courseId: 'default-course',
          riskStatus: RiskStatus.GREEN,
          relationalRole: RelationalRole.HEALTHY,
        };

        await addDoc(collection(db, 'students'), {
          ...newStudent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        importedCount++;
      }

      alert(`Importación completada. Se importaron ${importedCount} estudiantes.`);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al importar archivo. Verifica el formato e intenta nuevamente.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-bold text-white mb-2 font-display">Importar Alumnos</h3>
        <p className="text-neutral-400 mb-6 text-sm">Sube un archivo CSV o Excel con los datos de tus estudiantes. Puedes descargar la plantilla para ver el formato requerido.</p>

        <div className="space-y-4">
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] text-blue-400 rounded-2xl font-bold hover:bg-[#1a1a1a] transition-all border border-blue-500/20"
          >
            <Download className="w-5 h-5" />
            Descargar Plantilla
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              ref={fileInputRef}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
            />
            <button
              disabled={isImporting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 ${isImporting ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]'} rounded-2xl font-bold transition-all`}
            >
              <Upload className="w-5 h-5" />
              {isImporting ? 'Importando...' : 'Subir Archivo'}
            </button>
          </div>

          <div className="pt-4">
            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="w-full py-3 px-6 bg-white/5 text-neutral-300 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;
