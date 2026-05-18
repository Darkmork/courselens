import { FormResponse } from '../types/FormResponse';

export async function generateGrowthNarrative(formResponses: FormResponse[], studentName: string): Promise<string> {
  // Sort by timestamp
  const sorted = [...formResponses].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Build context from responses
  const context = sorted.map(response => ({
    date: new Date(response.timestamp).toLocaleDateString('es-CL'),
    formType: response.formType.replace(/_/g, ' '),
    data: response.responses,
  }));

  const prompt = buildNarrativePrompt(studentName, context);
  return prompt;
}

function buildNarrativePrompt(studentName: string, context: any[]): string {
  const dataStr = context
    .map(
      ctx => `
**${ctx.formType}** (${ctx.date}):
${JSON.stringify(ctx.data, null, 2)}
`
    )
    .join('\n');

  return `Eres un psicólogo educativo especializado en reportes de desarrollo de adolescentes.

Basándote en estos datos de ${studentName} capturados en diferentes momentos del año escolar:

${dataStr}

Crea un RELATO NARRATIVO que:
1. Describe la evolución y crecimiento del estudiante
2. Destaca cambios significativos (positivos y desafíos)
3. Conecta datos académicos, sociales, emocionales y personales
4. Identifica patrones de crecimiento
5. Proyecta hacia el futuro basándote en los datos

Requisitos:
- Tono: Cálido, reflexivo, empoderador
- Lenguaje: Español, académico pero accesible
- Extensión: 250-400 palabras
- Estructura: Introducción → Desarrollo → Reflexión
- Incluye citas o datos específicos del formulario

Comienza el relato directamente sin encabezados.`;
}
