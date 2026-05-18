import express, { Request } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import * as admin from "firebase-admin";
import { parseGroupPDFWithDeepSeek } from "./src/lib/pulsoParser";
import { calculateMetrics } from "./src/lib/sociogramMetrics";
import type { SociogramData, SociogramRelation } from "./src/types/index";

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

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log("Firebase Admin already initialized");
      return;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✓ Firebase Admin initialized with service account credentials");
      } catch (parseError) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseError);
        // Continue anyway - will fail at runtime if Firestore is needed
      }
    } else {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT not set. Firebase operations may fail.");
      // Try to initialize with project ID only (works if service account is bound to environment)
      try {
        admin.initializeApp({
          projectId: "gen-lang-client-0735793190",
        });
        console.log("✓ Firebase Admin initialized with project ID only");
      } catch (error) {
        console.warn("⚠️  Could not initialize Firebase. Set FIREBASE_SERVICE_ACCOUNT env variable.");
      }
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Don't throw - let the app start anyway
  }
}

async function startServer() {
  // Initialize Firebase Admin
  initializeFirebaseAdmin();

  // Get Firestore instance with correct database
  let db: any = null;
  try {
    if (admin.apps.length > 0) {
      const firestoreApp = admin.app();
      // Specify the non-default database ID (must be an object with databaseId property)
      db = firestoreApp.firestore({ databaseId: "ai-studio-d6f02050-bc9d-4a7d-a7a3-b7ea6ef62a02" });
      console.log("✓ Firestore initialized with correct database ID");
    }
  } catch (error) {
    console.warn("❌ Could not initialize Firestore:", error);
  }
  const app = express();

  // Increase timeout for long-running requests (DeepSeek API calls can take 30-60s)
  app.use((req, res, next) => {
    req.setTimeout(120000); // 2 minutes for full request
    res.setTimeout(120000);
    next();
  });

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

  // POST /api/import/sociogram - Import PULSO.cl group sociogram PDF
  app.post("/api/import/sociogram", async (req, res) => {
    try {
      // Check Firebase is initialized
      if (!db) {
        return res.status(500).json({
          error: "Firebase not initialized",
          details: "FIREBASE_SERVICE_ACCOUNT environment variable not configured in Railway",
          status: "firebase_not_ready",
        });
      }

      // Validate file upload
      if (!req.files || !req.files.groupPdf) {
        return res.status(400).json({
          error: "groupPdf is required",
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

      console.log(`Importing sociogram for course ${courseId}, year ${year}`);

      // Parse group PDF using DeepSeek to extract table data
      const parseResult = await parseGroupPDFWithDeepSeek(groupPdfFile.data);
      const { studentData, relations: rawRelations } = parseResult;

      console.log(`Parsed ${studentData.length} students from group PDF via DeepSeek`);

      // Convert studentData to StudentSociogramData format with IDs
      const estudiantes = studentData.map((student: any) => ({
        id: student.nombre
          .replace(/\s+/g, '-')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, ''),
        nombre: student.nombre,
        rol: student.rol || 'No responde',
        autoreporte: student.autoreporte,
        menciones_positivas: student.menciones_positivas,
        menciones_negativas: student.menciones_negativas,
        comentarios: {
          positivos: null,
          negativos: null,
        },
      }));

      // Build relations from parsed data
      const relaciones: SociogramRelation[] = [];
      const allowedTipos = ['trabajo_positivo', 'convivencia_positiva', 'trabajo_negativo', 'convivencia_negativa'];

      for (const rel of rawRelations) {
        const fromStudent = estudiantes.find(
          (s: any) => s.nombre.toLowerCase().trim() === rel.from.toLowerCase().trim()
        );
        const toStudent = estudiantes.find(
          (s: any) => s.nombre.toLowerCase().trim() === rel.to.toLowerCase().trim()
        );

        if (fromStudent && toStudent && allowedTipos.includes(rel.tipo)) {
          relaciones.push({
            from_id: fromStudent.id,
            to_id: toStudent.id,
            tipo: rel.tipo as SociogramRelation['tipo'],
            fuerza: Math.max(1, Math.min(3, rel.count)),
          });
        }
      }

      console.log(`Created ${relaciones.length} relations`);

      // Calculate metrics
      const metricas = calculateMetrics({
        estudiantes,
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
        estudiantes,
        relaciones,
        metricas,
      };

      // Save to Firestore using Admin SDK
      await db.collection(`sociogram_${year}`).doc(courseId).set(sociogramData);

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
          studentCount: estudiantes.length,
          relationCount: relaciones.length,
          metrics: metricas,
        },
        note: 'Check server logs for token usage details from DeepSeek',
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
