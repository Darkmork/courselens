import React, { useRef } from 'react';
import { Download, Eye, Copy, CheckCircle } from 'lucide-react';

interface DigitalBookProps {
  courseName: string;
  courseYear: number;
  studentName?: string;
  content: string;
  type: 'course' | 'student';
  onExport?: (format: 'html' | 'pdf') => void;
}

export const DigitalBook: React.FC<DigitalBookProps> = ({
  courseName,
  courseYear,
  studentName,
  content,
  type,
  onExport,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const generateHTML = () => {
    const title = type === 'course' ? `${courseName} - Año ${courseYear}` : `Perfil de ${studentName}`;
    const subtitle =
      type === 'course'
        ? 'Historia colectiva de transformación'
        : 'Viaje personal de crecimiento';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
    }

    body {
      background: linear-gradient(to bottom, #f8f9fa, #ffffff);
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    /* Cover */
    .cover {
      background: linear-gradient(135deg, #0066cc 0%, #00ccff 100%);
      padding: 80px 40px;
      text-align: center;
      color: white;
    }

    .cover h1 {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 16px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .cover p {
      font-size: 20px;
      opacity: 0.95;
      margin-bottom: 24px;
    }

    .cover-meta {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }

    /* Content */
    .content {
      padding: 60px 40px;
    }

    .content h2 {
      font-size: 32px;
      margin-bottom: 24px;
      margin-top: 40px;
      color: #0066cc;
    }

    .content h2:first-child {
      margin-top: 0;
    }

    .content p {
      font-size: 16px;
      margin-bottom: 16px;
      line-height: 1.8;
      color: #333;
    }

    .content ul, .content ol {
      margin-bottom: 24px;
      margin-left: 24px;
    }

    .content li {
      margin-bottom: 12px;
      font-size: 16px;
      color: #555;
    }

    .highlight {
      background: linear-gradient(120deg, #fff5e0 0%, #ffe0b2 100%);
      border-left: 4px solid #ff9800;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
      font-style: italic;
      color: #e65100;
    }

    /* Timeline */
    .timeline {
      margin: 40px 0;
    }

    .timeline-item {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
    }

    .timeline-item:last-child {
      border-bottom: none;
    }

    .timeline-marker {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0066cc, #00ccff);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }

    .timeline-content h3 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #0066cc;
    }

    .timeline-content p {
      margin-bottom: 8px;
    }

    /* Footer */
    .footer {
      background: #f5f5f5;
      padding: 40px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
    }

    .footer p {
      margin-bottom: 8px;
    }

    /* Print */
    @media print {
      body {
        padding: 0;
        background: white;
      }

      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cover -->
    <div class="cover">
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="cover-meta">
        <p>Año Académico ${courseYear}</p>
        <p>📚 Generado automáticamente</p>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>CourseLife</strong> - Plataforma de análisis educativo integral</p>
      <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
  </div>
</body>
</html>`;
  };

  const html = generateHTML();

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'html' | 'pdf') => {
    if (format === 'html') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseName}-${courseYear}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      window.print();
    }
    onExport?.(format);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex gap-3 flex-wrap">
        <button
          onClick={() => handleDownload('html')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar HTML
        </button>
        <button
          onClick={() => handleDownload('pdf')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Imprimir PDF
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ml-auto"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar HTML
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      <div ref={previewRef} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '800px',
            border: 'none',
            borderRadius: '8px',
          }}
          title="Digital Book Preview"
        />
      </div>

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex gap-3 items-start">
        <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
        <div className="text-sm text-neutral-300">
          <p className="font-bold text-white mb-2">Vista Previa del Libro Digital</p>
          <p>
            Descarga en HTML para compartir, imprimir como PDF, o editar en tu editor preferido. El diseño es responsivo y se vea bien en cualquier dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitalBook;
