import React, { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up PDF.js worker from local package
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface ImportSummary {
  studentCount: number;
  relationCount: number;
  metrics: {
    cohesion: number;
    fragmentacion: number;
  };
}

interface ImportSociogramProps {
  courseId?: string;
  onBack?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Set up PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

async function renderPdfPageToImage(file: File, pageNum: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  if (pageNum > pdf.numPages) {
    throw new Error(`PDF has only ${pdf.numPages} pages, requested page ${pageNum}`);
  }

  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  await page.render({ canvasContext: context, viewport }).promise;

  // Convert to base64 JPEG
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Failed to convert canvas to blob');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.85);
  });
}

export const ImportSociogram: React.FC<ImportSociogramProps> = ({
  courseId = 'course-1',
  onBack
}) => {
  const [groupPdf, setGroupPdf] = useState<File | null>(null);
  const [year, setYear] = useState<string>('2025');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [graphImages, setGraphImages] = useState<{ page2?: string; page3?: string }>({});

  // File input ref for resetting
  const groupPdfInputRef = useRef<HTMLInputElement>(null);

  const handleGroupPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setImportStatus('error');
      setImportMessage('Por favor selecciona un archivo PDF válido para el reporte grupal');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImportStatus('error');
      setImportMessage('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    setGroupPdf(file);
    setImportStatus('idle');
    setImportMessage('Extrayendo gráficos de relaciones...');

    // Render relationship graph pages (2-3) to images
    try {
      const images: { page2?: string; page3?: string } = {};

      try {
        images.page2 = await renderPdfPageToImage(file, 2);
        console.log('✓ Rendered page 2 (trabajo positivo graph)');
      } catch (err) {
        console.warn('Could not render page 2:', err);
      }

      try {
        images.page3 = await renderPdfPageToImage(file, 3);
        console.log('✓ Rendered page 3 (convivencia positiva graph)');
      } catch (err) {
        console.warn('Could not render page 3:', err);
      }

      setGraphImages(images);
      setImportMessage('✓ PDF cargado. Gráficos extraídos.');
    } catch (error) {
      console.error('Error rendering PDF pages:', error);
      setImportMessage('PDF cargado, pero no se pudieron extraer los gráficos (continuará sin ellos)');
    }
  };


  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupPdf || !year || !courseId) {
      setImportStatus('error');
      setImportMessage('Todos los campos son requeridos');
      return;
    }

    setImportStatus('loading');
    setImportMessage('Cargando y analizando PDF con DeepSeek...');

    try {
      const formData = new FormData();
      formData.append('groupPdf', groupPdf);
      formData.append('year', year);
      formData.append('courseId', courseId);

      // Add rendered graph images if available
      if (graphImages.page2) {
        formData.append('graphPage2', graphImages.page2);
      }
      if (graphImages.page3) {
        formData.append('graphPage3', graphImages.page3);
      }

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
        // Server returned parsed data - now save to Firestore using client SDK
        setImportMessage('Guardando datos en Firestore...');

        if (data.data) {
          const docRef = doc(db, `sociogram_${year}`, courseId);
          await setDoc(docRef, data.data);
          console.log(`✓ Sociogram saved to sociogram_${year}/${courseId}`);
        }

        setImportStatus('success');
        setImportMessage(`✓ ${data.message} y guardado en base de datos`);
        if (data.summary) {
          setImportSummary(data.summary);
        }

        // Reset form
        setGroupPdf(null);
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('Import error:', error);
    }
  };

  const handleReset = () => {
    setGroupPdf(null);
    setImportStatus('idle');
    setImportMessage('');
    setImportSummary(null);

    // Clear file input
    if (groupPdfInputRef.current) groupPdfInputRef.current.value = '';
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
            <p className="text-gray-400">Sube los reportes PDF de PULSO.cl para importar datos de sociograma</p>
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

          {/* Group PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Reporte Grupal (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={groupPdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handleGroupPdfChange}
                className="hidden"
                id="groupPdf"
                disabled={importStatus === 'loading'}
              />
              <label htmlFor="groupPdf" className="cursor-pointer block">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">
                  {groupPdf ? (
                    <span className="text-green-400 font-medium">{groupPdf.name}</span>
                  ) : (
                    'Haz clic para seleccionar el reporte grupal'
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

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={importStatus === 'loading' || !groupPdf}
              aria-label="Importar sociograma"
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
          <p className="font-medium mb-2">Archivo esperado:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-300/90">
            <li><strong>Reporte Grupal (PDF):</strong> Documento PULSO.cl que contiene la tabla resumen con todos los estudiantes, roles, autoreporte, menciones (positivas y negativas) y relaciones entre estudiantes.</li>
          </ul>
          <p className="mt-3 text-blue-300/80 text-xs">✨ El sistema usa DeepSeek AI para extraer y analizar los datos de la tabla automáticamente. Los datos se guardarán en la base de datos de la clase seleccionada.</p>
        </div>
      </div>
    </div>
  );
};

export default ImportSociogram;
