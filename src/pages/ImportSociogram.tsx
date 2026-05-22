import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';

interface ImportSummary {
  studentCount: number;
  relationCount: number;
  metrics: {
    cohesion: number;
    fragmentacion: number;
  };
}

interface CourseVision {
  course_vision: string;
  highlighted_students: Array<{ nombre: string; reason: string; strengths: string[] }>;
  at_risk_students: Array<{ nombre: string; reason: string; concerns: string[] }>;
  dynamics_summary: string;
}

interface ImportSociogramProps {
  courseId?: string;
  onBack?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ImportSociogram: React.FC<ImportSociogramProps> = ({
  courseId = 'course-1',
  onBack
}) => {
  const [groupMarkdown, setGroupMarkdown] = useState<File | null>(null);
  const [individualMarkdown, setIndividualMarkdown] = useState<File | null>(null);
  const [year, setYear] = useState<string>('2025');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [courseVision, setCourseVision] = useState<CourseVision | null>(null);

  // File input refs for resetting
  const groupInputRef = useRef<HTMLInputElement>(null);
  const individualInputRef = useRef<HTMLInputElement>(null);

  const handleGroupMarkdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.md')) {
      setImportStatus('error');
      setImportMessage('Por favor selecciona un archivo Markdown (.md) válido');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImportStatus('error');
      setImportMessage('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    setGroupMarkdown(file);
    setImportStatus('idle');
    setImportMessage('✓ Reporte grupal cargado');
  };

  const handleIndividualMarkdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.md')) {
      setImportStatus('error');
      setImportMessage('Por favor selecciona un archivo Markdown (.md) válido');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImportStatus('error');
      setImportMessage('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    setIndividualMarkdown(file);
    setImportStatus('idle');
    setImportMessage('✓ Reporte individual cargado');
  };


  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupMarkdown || !individualMarkdown || !year || !courseId) {
      setImportStatus('error');
      setImportMessage('Se requieren ambos archivos: grupal e individual');
      return;
    }

    setImportStatus('loading');
    setImportMessage('Analizando archivos Markdown con DeepSeek...');

    try {
      const formData = new FormData();
      if (groupMarkdown) {
        formData.append('groupMarkdown', groupMarkdown);
      }
      if (individualMarkdown) {
        formData.append('individualMarkdown', individualMarkdown);
      }
      formData.append('year', year);
      formData.append('courseId', courseId);

      const response = await fetch('/api/import/sociogram', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setImportStatus('error');
        setImportMessage(data.error || 'La importación falló');
        console.error('Import error:', data);
      } else {
        // Server handled Firestore save - show success and analysis
        setImportStatus('success');
        setImportMessage(`✓ ${data.message} y análisis guardado en base de datos`);
        if (data.summary) {
          setImportSummary(data.summary);
        }
        if (data.courseVision) {
          setCourseVision(data.courseVision);
        }

        // Reset form
        setGroupMarkdown(null);
        setIndividualMarkdown(null);
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('Import error:', error);
    }
  };

  const handleReset = () => {
    setGroupMarkdown(null);
    setIndividualMarkdown(null);
    setImportStatus('idle');
    setImportMessage('');
    setImportSummary(null);
    setCourseVision(null);

    // Clear file inputs
    if (groupInputRef.current) groupInputRef.current.value = '';
    if (individualInputRef.current) individualInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
              aria-label="Volver a sociograma"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Importar Sociograma</h1>
            <p className="text-gray-400">Sube ambos archivos Markdown para generar análisis completo del curso</p>
          </div>
        </div>

        <form onSubmit={handleImport} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg shadow-xl p-8 space-y-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Año Académico</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={importStatus === 'loading'}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Group Markdown File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Reporte Grupal (Markdown) - Requerido
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={groupInputRef}
                type="file"
                accept=".md,text/markdown,text/plain"
                onChange={handleGroupMarkdownChange}
                className="hidden"
                id="groupMarkdown"
                disabled={importStatus === 'loading'}
              />
              <label htmlFor="groupMarkdown" className="cursor-pointer block">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">
                  {groupMarkdown ? (
                    <span className="text-green-400 font-medium">{groupMarkdown.name}</span>
                  ) : (
                    'Haz clic para seleccionar el reporte grupal'
                  )}
                </p>
              </label>
            </div>
          </div>

          {/* Individual Markdown File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Reporte Individual (Markdown) - Recomendado
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                ref={individualInputRef}
                type="file"
                accept=".md,text/markdown,text/plain"
                onChange={handleIndividualMarkdownChange}
                className="hidden"
                id="individualMarkdown"
                disabled={importStatus === 'loading'}
              />
              <label htmlFor="individualMarkdown" className="cursor-pointer block">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">
                  {individualMarkdown ? (
                    <span className="text-green-400 font-medium">{individualMarkdown.name}</span>
                  ) : (
                    'Haz clic para seleccionar el reporte individual (mejor estructura)'
                  )}
                </p>
              </label>
            </div>
          </div>


          {/* Status Message */}
          {importStatus !== 'idle' && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                importStatus === 'error'
                  ? 'bg-red-900/20 border-red-700 text-red-300'
                  : importStatus === 'success'
                  ? 'bg-green-900/20 border-green-700 text-green-300'
                  : 'bg-blue-900/20 border-blue-700 text-blue-300'
              }`}
            >
              {importStatus === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              {importStatus === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              {importStatus === 'loading' && <Loader className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" />}
              <div className="flex-1">
                <p className="font-medium">{importMessage}</p>
                {importSummary && importStatus === 'success' && (
                  <div className="mt-2 text-sm space-y-1 opacity-90">
                    <p>Estudiantes importados: {importSummary.studentCount}</p>
                    <p>Relaciones detectadas: {importSummary.relationCount}</p>
                    <p>Cohesión: {importSummary.metrics.cohesion.toFixed(1)}/10</p>
                    <p>Fragmentación: {importSummary.metrics.fragmentacion.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Course Vision Analysis */}
          {courseVision && importStatus === 'success' && (
            <div className="mt-6 space-y-6 bg-gray-900/50 rounded-lg border border-gray-700 p-6">
              {/* Course Vision Narrative */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">📋 Visión del Curso</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{courseVision.course_vision}</p>
              </div>

              {/* Highlighted Students */}
              {courseVision.highlighted_students.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-3">⭐ Estudiantes Destacados</h3>
                  <div className="space-y-3">
                    {courseVision.highlighted_students.map((student, idx) => (
                      <div key={idx} className="bg-green-900/20 border border-green-700 rounded p-3">
                        <p className="font-semibold text-white">{student.nombre}</p>
                        <p className="text-sm text-gray-300 mt-1">{student.reason}</p>
                        <ul className="text-xs text-gray-400 mt-2 space-y-1">
                          {student.strengths.map((strength, i) => (
                            <li key={i}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* At-Risk Students */}
              {courseVision.at_risk_students.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-3">⚠️ Estudiantes que Requieren Atención</h3>
                  <div className="space-y-3">
                    {courseVision.at_risk_students.map((student, idx) => (
                      <div key={idx} className="bg-orange-900/20 border border-orange-700 rounded p-3">
                        <p className="font-semibold text-white">{student.nombre}</p>
                        <p className="text-sm text-gray-300 mt-1">{student.reason}</p>
                        <ul className="text-xs text-gray-400 mt-2 space-y-1">
                          {student.concerns.map((concern, i) => (
                            <li key={i}>• {concern}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamics Summary */}
              <div>
                <h3 className="text-lg font-bold text-blue-400 mb-3">🔗 Dinámicas del Grupo</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{courseVision.dynamics_summary}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={importStatus === 'loading' || !groupMarkdown || !individualMarkdown}
              aria-label="Importar sociograma y generar análisis"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {importStatus === 'loading' ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar Sociograma'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Limpiar formulario"
              className="px-4 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
            >
              Limpiar
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-sm text-blue-200">
          <p className="font-medium mb-2">Archivos requeridos (ambos):</p>
          <ul className="list-disc list-inside space-y-2 text-blue-300/90">
            <li><strong>Reporte Grupal (Markdown):</strong> Archivo .md generado por MarkItDown del PDF grupal de PULSO.cl</li>
            <li><strong>Reporte Individual (Markdown):</strong> Archivo .md generado por MarkItDown del PDF individual de PULSO.cl</li>
          </ul>
          <p className="mt-3 text-blue-300/80 text-xs">✨ <strong>Qué genera el análisis:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-blue-300/80 text-xs ml-2">
            <li>Visión narrativa del curso (dinámicas, clima relacional)</li>
            <li>Estudiantes destacados (líderes, alto bienestar)</li>
            <li>Estudiantes que requieren atención (riesgos, aislamiento)</li>
            <li>Tabla de datos con autoreporte y menciones por estudiante</li>
            <li>Matriz de riesgos (bienestar vs menciones negativas)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportSociogram;
