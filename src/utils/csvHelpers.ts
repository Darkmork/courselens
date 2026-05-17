import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Student, RiskStatus, RelationalRole } from '../types';

export const EXPORT_HEADERS = [
  'Nombre', 'RUT', 'Fecha de Nacimiento', 'Email', 'Teléfono', 'Dirección', 
  'Nombre Apoderado 1', 'Parentesco Apo. 1', 'Email Apo. 1', 'Teléfono Apo. 1',
  'Nombre Apoderado 2', 'Parentesco Apo. 2', 'Email Apo. 2', 'Teléfono Apo. 2',
  'Situación Familiar', 'Apoyo Externo', 'Alertas Médicas'
];

export const downloadTemplate = () => {
  const ws = XLSX.utils.json_to_sheet([{
    'Nombre': 'Juan Perez',
    'RUT': '12345678-9',
    'Fecha de Nacimiento': '2010-05-15',
    'Email': 'juan@example.com',
    'Teléfono': '+56912345678',
    'Dirección': 'Av Siempre Viva 123',
    'Nombre Apoderado 1': 'Maria Perez',
    'Parentesco Apo. 1': 'Madre',
    'Email Apo. 1': 'maria@example.com',
    'Teléfono Apo. 1': '+56987654321',
    'Nombre Apoderado 2': 'Pedro Perez',
    'Parentesco Apo. 2': 'Padre',
    'Email Apo. 2': 'pedro@example.com',
    'Teléfono Apo. 2': '+56987654322',
    'Situación Familiar': 'Vive con ambos padres',
    'Apoyo Externo': 'Psicólogo 1 vez por mes',
    'Alertas Médicas': 'Alérgico al maní'
  }], { header: EXPORT_HEADERS });
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Alumnos");
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data, 'Plantilla_Alumnos.xlsx');
};

export const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Formato de archivo no soportado. Use .csv o .xlsx"));
    }
  });
};
