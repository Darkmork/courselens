import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { Page } from '../App';

interface ImportProps {
  onNavigate?: (page: Page) => void;
}

export const ImportForms: React.FC<ImportProps> = ({ onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formType, setFormType] = useState<'inicio_III_medio' | 'fin_I_semestre' | 'inicio_IV_medio'>('inicio_III_medio');
  const [courseId, setCourseId] = useState('course-1');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Solo se permiten archivos CSV');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo CSV');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('formType', formType);
      formData.append('courseId', courseId);

      const response = await fetch('/api/import/form-responses', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setSelectedFile(null);
      } else {
        setError(data.error || 'Error en la importación');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">Importar Formularios</h2>

        <div className="space-y-6 bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">1. Selecciona archivo CSV</label>
            <div
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <Upload className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
              {selectedFile ? (
                <div>
                  <p className="text-white font-bold">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-white">Arrastra un archivo CSV o haz clic para seleccionar</p>
                  <p className="text-xs text-neutral-400 mt-1">Exportado desde Google Forms</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Type Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">2. Tipo de formulario</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="inicio_III_medio">Inicio III Medio</option>
              <option value="fin_I_semestre">Fin I Semestre</option>
              <option value="inicio_IV_medio">Inicio IV Medio</option>
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">3. Curso</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="course-1"
              className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-neutral-400 mt-2">Debe coincidir con courseId en Students</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-300">Importación completada</p>
                  <p className="text-sm text-neutral-200 mt-1">
                    {result.imported} de {result.totalRows} estudiantes importados
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-black/30 rounded p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-yellow-300 mb-2">{result.errors.length} errores:</p>
                  <ul className="text-xs text-neutral-300 space-y-1">
                    {result.errors.slice(0, 5).map((err: any, i: number) => (
                      <li key={i}>
                        Fila {err.row}: {err.email} - {err.reason}
                      </li>
                    ))}
                    {result.errors.length > 5 && <li>... y {result.errors.length - 5} más</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar Formularios'
            )}
          </button>
        </div>

        {/* Back Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('students')}
            className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-mono"
          >
            ← Volver a Estudiantes
          </button>
        )}
      </div>
    </div>
  );
};

export default ImportForms;
