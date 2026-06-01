import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, Zap } from 'lucide-react';
import type { Page } from '../App';
import { DEFAULT_COURSE_ID } from '../lib/constants';

interface FileUpload {
  file: File | null;
  formType: 'inicio_III_medio' | 'mediados_III_medio' | 'inicio_IV_medio';
}

interface ImportProps {
  onNavigate?: (page: Page) => void;
}

const FORM_CONFIG = {
  inicio_III_medio: {
    label: 'Inicio III Medio',
    description: 'Diagnóstico inicial (marzo)',
    icon: '📋',
  },
  mediados_III_medio: {
    label: 'Mediados III Medio',
    description: 'Checkpoint intermedio (mayo-junio)',
    icon: '⚡',
  },
  inicio_IV_medio: {
    label: 'Inicio IV Medio',
    description: 'Reflexión final (septiembre)',
    icon: '🎯',
  },
};

export const ImportForms: React.FC<ImportProps> = ({ onNavigate }) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [files, setFiles] = useState<FileUpload[]>([
    { file: null, formType: 'inicio_III_medio' },
    { file: null, formType: 'mediados_III_medio' },
    { file: null, formType: 'inicio_IV_medio' },
  ]);
  const [courseId, setCourseId] = useState(DEFAULT_COURSE_ID);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (formType: string, file: File) => {
    if (file.type === 'text/csv') {
      setFiles(f => f.map(item =>
        item.formType === formType ? { ...item, file } : item
      ));
      setError(null);
    } else {
      setError('Solo se permiten archivos CSV');
    }
  };

  const handleImport = async () => {
    const selectedFiles = files.filter(f => f.file);
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo CSV');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('courseId', courseId);

      files.forEach(item => {
        if (item.file) {
          formData.append(`${item.formType}File`, item.file);
        }
      });

      const response = await fetch('/api/import/forms-batch', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setFiles(f => f.map(item => ({ ...item, file: null })));
      } else {
        setError(data.error || 'Error en la importación');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const allFilesSelected = files.every(f => f.file);
  const anyFileSelected = files.some(f => f.file);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Importar Vida del Curso
            </h1>
          </div>
          <p className="text-neutral-300 text-lg">
            Captura los 3 momentos clave de tu curso: inicio, checkpoint y reflexión final
          </p>
        </div>

        <div className="space-y-8">
          {/* Course Selection */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <label className="block text-sm font-bold text-white mb-3">Curso</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder={DEFAULT_COURSE_ID}
              className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* File Uploads Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {files.map((item, idx) => {
              const config = FORM_CONFIG[item.formType];
              const isSelected = item.file !== null;

              return (
                <div
                  key={item.formType}
                  className={`bg-[#1a1a1a] border rounded-xl p-6 transition-all ${
                    isSelected
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-3">{config.icon}</div>
                  <h3 className="font-bold text-white mb-1">{config.label}</h3>
                  <p className="text-xs text-neutral-400 mb-4">{config.description}</p>

                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/20 hover:border-blue-500/50'
                    }`}
                    onClick={() => fileInputRefs.current[item.formType]?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect(item.formType, file);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      ref={(el) => {
                        if (el) fileInputRefs.current[item.formType] = el;
                      }}
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(item.formType, file);
                      }}
                      className="hidden"
                    />
                    {isSelected ? (
                      <div>
                        <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-white font-bold truncate">{item.file!.name}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {(item.file!.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-5 h-5 text-neutral-500 mx-auto mb-2" />
                        <p className="text-xs text-neutral-300">Arrastra CSV</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

          {/* Results */}
          {results && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 space-y-4">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-300 text-lg">Importación completada</p>
                  <p className="text-sm text-neutral-200 mt-1">
                    Total: {results.summary.totalImported} estudiantes importados
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">
                {results.results.map((res: any) => (
                  <div key={res.formType} className="bg-black/20 rounded p-3 border border-green-500/20">
                    <p className="text-xs font-bold text-green-300">{FORM_CONFIG[res.formType as keyof typeof FORM_CONFIG].label}</p>
                    <p className="text-sm text-white font-bold mt-1">{res.imported}/{res.totalRows}</p>
                    {res.errors.length > 0 && (
                      <p className="text-xs text-yellow-300 mt-1">{res.errors.length} errores</p>
                    )}
                  </div>
                ))}
              </div>

              {results.results.some((r: any) => r.errors.length > 0) && (
                <div className="bg-black/30 rounded p-3 max-h-48 overflow-y-auto border border-yellow-500/20">
                  <p className="text-xs font-bold text-yellow-300 mb-2">Errores encontrados:</p>
                  <ul className="text-xs text-neutral-300 space-y-1">
                    {results.results.flatMap((r: any) => r.errors).slice(0, 10).map((err: any, i: number) => (
                      <li key={i} className="text-yellow-200">
                        {err.email} - {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleImport}
            disabled={!anyFileSelected || isImporting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-neutral-600 disabled:to-neutral-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-3 text-lg"
          >
            {isImporting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Importando vida del curso...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importar {files.filter(f => f.file).length === 3 ? '3 Momentos' : files.filter(f => f.file).length === 1 ? 'Momento' : 'Momentos'}
              </>
            )}
          </button>
        </div>

        {/* Back Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('students')}
            className="mt-8 text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors"
          >
            ← Volver a Estudiantes
          </button>
        )}
      </div>
    </div>
  );
};

export default ImportForms;
