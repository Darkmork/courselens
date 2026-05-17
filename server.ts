import express, { Request } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { setDoc, doc } from "firebase/firestore";
import { parseGroupPDF, parseIndividualPDF } from "./src/lib/pulsoParser";
import { calculateMetrics } from "./src/lib/sociogramMetrics";
import type { SociogramData, SociogramRelation } from "./src/types/index";
import { db } from "./src/lib/firebase";

// Extend Express Request type to include files from express-fileupload
declare global {
  namespace Express {
    interface Request {
      files?: { [key: string]: fileUpload.UploadedFile | fileUpload.UploadedFile[] };
    }
  }
}

dotenv.config();

const API_PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
      abortOnLimit: true,
      responseOnLimit: "File size exceeds 50MB limit",
    })
  );

  // DeepSeek API setup
  const ai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseURL: "https://api.deepseek.com",
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/analyze-risk", async (req, res) => {
    try {
      const { studentData } = req.body;

      const prompt = `Analiza la siguiente data de estudiantes y entrega una evaluación de riesgo en formato JSON.
      Data: ${JSON.stringify(studentData)}
      Retorna un JSON con:
      - riskStatus: "Rojo" | "Amarillo" | "Verde"
      - contributingFactors: string (escrito en español)
      - recommendedInterventions: string (escrito en español)
      - reasoning: string (escrito en español)`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });

      const text = result.choices[0].message.content || "";

      // Basic JSON extraction from markdown if necessary
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("AI Risk Assessment Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/summarize-student", async (req, res) => {
    try {
      const { studentData } = req.body;

      const prompt = `Genera un resumen completo y profesional del estudiante para prepararse para una entrevista con los apoderados (padres/tutores).

      Datos del Estudiante:
      ${JSON.stringify(studentData)}

      El resumen debe estar en español y en formato Markdown.
      Estructura sugerida:
      - Resumen General y Contexto
      - Fortalezas y Logros
      - Áreas de Preocupación / Desafíos (basado en riesgo, conflictos, apoyo externo)
      - Puntos a conversar recomendados para la reunión
      - Tono sugerido para la entrevista`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });

      res.json({ summary: result.choices[0].message.content });
    } catch (error: any) {
      console.error("AI Summarize Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-report", async (req, res) => {
    try {
      const { courseData, timeframe } = req.body;

      const prompt = `Genera un reporte profesional de salud del curso basado en esta data para el periodo: ${timeframe}.
      Data: ${JSON.stringify(courseData)}
      El reporte debe estar en formato Markdown, ser muy profesional, en ESPAÑOL, e incluir las siguientes secciones:
      - Estado General
      - Desempeño Académico
      - Dinámicas Relacionales
      - Tendencias Emocionales
      - Logros Principales
      - Desafíos y Recomendaciones`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });

      res.json({ report: result.choices[0].message.content });
    } catch (error: any) {
      console.error("AI Report Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/import/sociogram - Import PULSO.cl sociogram PDFs
  app.post("/api/import/sociogram", async (req, res) => {
    try {
      // Validate file uploads
      if (!req.files || !req.files.groupPdf || !req.files.individualPdf) {
        return res.status(400).json({
          error: "Both groupPdf and individualPdf are required",
          status: "validation_failed",
        });
      }

      const { year, courseId } = req.body;
      if (!year || !courseId) {
        return res.status(400).json({
          error: "year and courseId are required in request body",
          status: "validation_failed",
        });
      }

      const groupPdfFile = req.files.groupPdf as fileUpload.UploadedFile;
      const individualPdfFile = req.files.individualPdf as fileUpload.UploadedFile;

      console.log(`Importing sociogram for course ${courseId}, year ${year}`);

      // Parse PDFs
      const { students: groupStudents, relations: groupRelations } = await parseGroupPDF(
        groupPdfFile.data
      );
      const individualStudents = await parseIndividualPDF(
        individualPdfFile.data
      );

      console.log(
        `Parsed ${groupStudents.length} students from group PDF, ${individualStudents.length} from individual PDF`
      );

      // Validate: all students in individual must be in group
      const groupStudentSet = new Set(
        groupStudents.map((s) => s.toLowerCase().trim())
      );
      for (const student of individualStudents) {
        if (
          !groupStudentSet.has(student.nombre.toLowerCase().trim())
        ) {
          return res.status(400).json({
            error: `Student "${student.nombre}" found in individual PDF but not in group PDF`,
            status: "validation_failed",
          });
        }
      }

      // Build relations from group and individual data
      const relaciones: SociogramRelation[] = [];
      const allowedTipos = ['trabajo_positivo', 'convivencia_positiva', 'trabajo_negativo', 'convivencia_negativa'];

      for (const groupRel of groupRelations) {
        const fromStudent = individualStudents.find(
          (s) => s.nombre.toLowerCase().trim() === groupRel.from.toLowerCase().trim()
        );
        const toStudent = individualStudents.find(
          (s) => s.nombre.toLowerCase().trim() === groupRel.to.toLowerCase().trim()
        );

        if (fromStudent && toStudent) {
          // Validate tipo value before using it
          if (!allowedTipos.includes(groupRel.tipo)) {
            console.warn(`Skipping invalid relation type: ${groupRel.tipo}`);
            continue;
          }

          relaciones.push({
            from_id: fromStudent.id,
            to_id: toStudent.id,
            tipo: groupRel.tipo as SociogramRelation['tipo'],
            fuerza: Math.max(1, Math.min(3, groupRel.count)), // Clamp to 1-3 range
          });
        } else {
          // Log which students caused the skip
          if (!fromStudent) console.debug(`Relation skipped: Student "${groupRel.from}" not found in individual PDF`);
          if (!toStudent) console.debug(`Relation skipped: Student "${groupRel.to}" not found in individual PDF`);
        }
      }

      console.log(`Created ${relaciones.length} relations`);

      // Calculate metrics
      const metricas = calculateMetrics({
        estudiantes: individualStudents,
        relaciones,
      });

      // Log calculated metrics for debugging
      console.debug('Calculated metrics:', {
        cohesion: metricas.cohesion.toFixed(2),
        fragmentacion: metricas.fragmentacion.toFixed(1) + '%',
        liderazgo_promedio: metricas.liderazgo_promedio.toFixed(2),
        aislamiento_promedio: metricas.aislamiento_promedio.toFixed(1) + '%',
      });

      // Build final SociogramData
      const sociogramData: SociogramData = {
        year: parseInt(year),
        courseId,
        estudiantes: individualStudents,
        relaciones,
        metricas,
      };

      // Save to Firestore
      const docRef = doc(db, `sociogram_${year}`, courseId);
      await setDoc(docRef, sociogramData);

      console.log(
        `Successfully saved sociogram for course ${courseId} at sociogram_${year}/${courseId}`
      );

      // Return success response
      res.json({
        success: true,
        message: `Sociograma ${year} imported successfully`,
        summary: {
          year: parseInt(year),
          courseId,
          studentCount: individualStudents.length,
          relationCount: relaciones.length,
          metrics: metricas,
        },
      });
    } catch (error) {
      console.error("Error importing sociogram:", error);
      res.status(500).json({
        error: "Failed to import sociogram",
        details: error instanceof Error ? error.message : String(error),
        status: "error",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(API_PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${API_PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
