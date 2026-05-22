import express, { Request } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import * as admin from "firebase-admin";
import { parseGroupPDFWithDeepSeek, parseMarkdownSociogram, parseSociogramWithAnalysis, regenerateCourseVision } from "./src/lib/pulsoParser";
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
        console.log(`✓ Service account loaded: project=${serviceAccount.project_id}, email=${serviceAccount.client_email}`);
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

  // Get Firestore instance
  let db: any = null;
  try {
    if (admin.apps.length > 0) {
      const firestoreApp = admin.app();
      // Use default database (where service account has full permissions)
      db = firestoreApp.firestore();

      // Test read to verify database is accessible
      try {
        const testDoc = await db.collection("students").limit(1).get();
        console.log(`✓ Firestore READ test passed (found ${testDoc.size} students)`);
      } catch (testError: any) {
        console.warn(`⚠️  Firestore READ test failed (code ${testError?.code}): ${testError?.message}`);
      }

      // Test write to verify database write permissions
      try {
        const testRef = db.collection("_tests").doc("_connectivity_test");
        await testRef.set({ timestamp: new Date(), status: "ok" });
        await testRef.delete();
        console.log("✓ Firestore WRITE test passed");
      } catch (writeError: any) {
        console.warn(`⚠️  Firestore WRITE test failed (code ${writeError?.code}): ${writeError?.message}`);
      }

      console.log("✓ Firestore initialized with default database");
      console.log(`✓ Using service account: ${process.env.FIREBASE_SERVICE_ACCOUNT ? "YES" : "NO (projectId only)"}`);
    }
  } catch (error) {
    console.error("❌ Could not initialize Firestore:", error);
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

  // DeepSeek API setup (v4-pro supports multimodal/images)
  const ai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseURL: "https://api.deepseek.com/v1",
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

  // POST /api/import/sociogram - Import PULSO.cl sociogram from Markdown files (requires both group and individual)
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

      // Validate file upload - now require BOTH files
      if (!req.files || !req.files.groupMarkdown || !req.files.individualMarkdown) {
        return res.status(400).json({
          error: "Both group and individual markdown files are required for course analysis",
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

      const groupMarkdownFile = req.files.groupMarkdown as fileUpload.UploadedFile;
      const individualMarkdownFile = req.files.individualMarkdown as fileUpload.UploadedFile;

      console.log(`Importing sociogram for course ${courseId}, year ${year}`);
      console.log(`Group markdown file: ${groupMarkdownFile.name}`);
      console.log(`Individual markdown file: ${individualMarkdownFile.name}`);

      // Convert buffers to strings
      const groupContent = groupMarkdownFile.data.toString('utf-8');
      const individualContent = individualMarkdownFile.data.toString('utf-8');

      // Parse both files and generate course analysis
      const analysisResult = await parseSociogramWithAnalysis(groupContent, individualContent);
      const { studentData, courseVision } = analysisResult;

      console.log(`Parsed ${studentData.length} students from markdown reports`);

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

      // Build relations (empty for now - no visual edges from markdown)
      const relaciones: SociogramRelation[] = [];

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

      console.log(
        `✓ Parsed sociogram data ready (${estudiantes.length} students)`
      );

      // Save to Firestore using Admin SDK
      try {
        console.log('✓ Saving sociogram data to Firestore...');
        const sociogramRef = db.collection(`sociogram_${year}`).doc(courseId);
        await sociogramRef.set(sociogramData);
        console.log(`✓ Sociogram saved to sociogram_${year}/${courseId}`);

        console.log('✓ Saving course vision analysis to Firestore...');
        const analysisRef = db.collection(`sociogram_analysis_${year}`).doc(courseId);
        await analysisRef.set({
          ...courseVision,
          timestamp: admin.firestore.Timestamp.now(),
          year: parseInt(year),
          courseId,
        });
        console.log(`✓ Course vision saved to sociogram_analysis_${year}/${courseId}`);
      } catch (firestoreError) {
        console.error('Firestore save error:', firestoreError);
        // Don't fail the request - data was parsed successfully
      }

      // Return parsed data WITH course vision analysis
      res.json({
        success: true,
        message: `Sociograma ${year} analyzed successfully`,
        data: sociogramData,
        courseVision,
        summary: {
          year: parseInt(year),
          courseId,
          studentCount: estudiantes.length,
          relationCount: relaciones.length,
          metrics: metricas,
        },
        note: 'Data saved to Firestore by server',
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

  // POST /api/regenerate-course-vision - Regenerate course analysis from existing sociogram data
  app.post("/api/regenerate-course-vision", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({
          error: "Firebase not initialized",
          status: "firebase_not_ready",
        });
      }

      const { year, courseId } = req.body;
      if (!year || !courseId) {
        return res.status(400).json({
          error: "year and courseId are required",
          status: "validation_failed",
        });
      }

      console.log(`Regenerating course vision for ${courseId}, year ${year}`);

      // Read existing sociogram data from Firestore
      try {
        const sociogramRef = db.collection(`sociogram_${year}`).doc(courseId);
        const sociogramDoc = await sociogramRef.get();

        if (!sociogramDoc.exists) {
          return res.status(404).json({
            error: `No sociogram data found for course ${courseId} in year ${year}`,
            status: "not_found",
          });
        }

        const sociogramData = sociogramDoc.data();
        const estudiantes = sociogramData.estudiantes || [];

        if (estudiantes.length === 0) {
          return res.status(400).json({
            error: "No student data available to analyze",
            status: "invalid_data",
          });
        }

        // Regenerate course vision analysis
        const courseVision = await regenerateCourseVision(estudiantes);

        // Save updated analysis to Firestore
        const analysisRef = db.collection(`sociogram_analysis_${year}`).doc(courseId);
        await analysisRef.set({
          ...courseVision,
          timestamp: admin.firestore.Timestamp.now(),
          year: parseInt(year),
          courseId,
        });

        console.log(`✓ Course vision regenerated and saved for ${courseId}`);

        res.json({
          success: true,
          message: "Course vision analysis regenerated successfully",
          courseVision,
        });
      } catch (error: any) {
        console.error("Error reading sociogram data:", error);
        res.status(500).json({
          error: "Failed to regenerate course vision",
          details: error.message,
          status: "error",
        });
      }
    } catch (error: any) {
      console.error("Error in regenerate-course-vision:", error);
      res.status(500).json({
        error: "Failed to regenerate course vision",
        details: error.message,
        status: "error",
      });
    }
  });

  app.post("/api/import/form-responses", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({
          error: "Firebase not initialized",
          status: "firebase_not_ready",
        });
      }

      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({
          error: "csvFile is required",
          status: "validation_failed",
        });
      }

      const { formType, courseId } = req.body;
      if (!formType || !courseId) {
        return res.status(400).json({
          error: "formType and courseId are required",
          status: "validation_failed",
        });
      }

      const csvFile = req.files.csvFile as fileUpload.UploadedFile;

      // Parse CSV
      const { parseCSV, validateAndMapRow } = await import("./src/lib/csvParser");
      const Papa = (await import("papaparse")).default;

      let rows: any[] = [];
      let headers: string[] = [];

      await new Promise<void>((resolve, reject) => {
        Papa.parse(csvFile.data.toString(), {
          complete: (results: any) => {
            headers = results.data[0] || [];
            rows = results.data.slice(1).filter((row: any[]) => row.some(cell => cell && cell.trim()));
            resolve();
          },
          error: (error: any) => reject(error),
        });
      });

      // Validate and map rows
      const validatedRows = rows.map((row, index) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, colIndex) => {
          rowObj[header] = row[colIndex] || "";
        });
        return validateAndMapRow(rowObj, formType, index + 2);
      });

      // Separate valid from invalid
      const validResponses = validatedRows.filter(r => !r.error).map(r => r.data);
      const errors = validatedRows.filter(r => r.error).map((r, index) => ({
        row: index + 2,
        email: rows[index]["Correo electrónico"] || rows[index]["Correo electronico"],
        reason: r.error,
      }));

      // Check student existence and save to Firestore
      let imported = 0;
      const studentErrors: Array<{ row: number; email: string; reason: string }> = [];

      for (let i = 0; i < validResponses.length; i++) {
        const response = validResponses[i];

        try {
          // Check if student exists
          const studentQuery = await db
            .collection("students")
            .where("email", "==", response.email)
            .where("courseId", "==", courseId)
            .limit(1)
            .get();

          if (studentQuery.empty) {
            studentErrors.push({
              row: rows.indexOf(rows[i]) + 2,
              email: response.email,
              reason: `Student with email ${response.email} not found in course ${courseId}`,
            });
            continue;
          }

          const studentId = studentQuery.docs[0].id;

          // Save to sub-collection
          await db
            .collection("students")
            .doc(studentId)
            .collection("formResponses")
            .doc(response.id)
            .set(response);

          imported++;
        } catch (error: any) {
          studentErrors.push({
            row: rows.indexOf(rows[i]) + 2,
            email: response.email,
            reason: `Database error: ${error.message}`,
          });
        }
      }

      res.json({
        success: true,
        totalRows: rows.length,
        imported,
        failed: validatedRows.filter(r => r.error).length + studentErrors.length,
        errors: [...errors, ...studentErrors],
      });
    } catch (error: any) {
      console.error("Error importing form responses:", error);
      res.status(500).json({
        error: "Failed to import form responses",
        details: error.message,
        status: "error",
      });
    }
  });

  app.post("/api/ai/generate-growth-narrative", async (req, res) => {
    try {
      const { studentId, formResponses } = req.body;

      if (!formResponses || formResponses.length < 2) {
        return res.status(400).json({
          error: "At least 2 form responses are required to generate a narrative",
          status: "validation_failed",
        });
      }

      // Get student name
      let studentName = "el estudiante";
      try {
        const studentDoc = await db.collection("students").doc(studentId).get();
        if (studentDoc.exists) {
          studentName = studentDoc.data()?.name || "el estudiante";
        }
      } catch (e) {
        console.warn("Could not fetch student name:", e);
      }

      // Generate prompt
      const { generateGrowthNarrative } = await import("./src/lib/growthNarrative");
      const prompt = await generateGrowthNarrative(formResponses, studentName);

      // Call DeepSeek
      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
        max_tokens: 1000,
      });

      const narrative = result.choices[0].message.content || "";

      res.json({ narrative });
    } catch (error: any) {
      console.error("Error generating narrative:", error);
      res.status(500).json({
        error: "Failed to generate narrative",
        details: error.message,
        status: "error",
      });
    }
  });

  // POST /api/import/forms-batch - Import 3 Google Forms CSVs (Inicio III, Mediados III, Inicio IV)
  app.post("/api/import/forms-batch", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({
          error: "Firebase not initialized",
          status: "firebase_not_ready",
        });
      }

      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({
          error: "courseId is required",
          status: "validation_failed",
        });
      }

      if (!req.files) {
        return res.status(400).json({
          error: "At least one CSV file is required",
          status: "validation_failed",
        });
      }

      const formTypes = ["inicio_III_medio", "mediados_III_medio", "inicio_IV_medio"] as const;
      const uploadedFiles = req.files;
      const Papa = (await import("papaparse")).default;
      const { validateAndMapRow } = await import("./src/lib/csvParser");

      interface BatchResult {
        formType: string;
        totalRows: number;
        imported: number;
        failed: number;
        errors: Array<{ row: number; email?: string; reason: string }>;
      }
      const batchResults: BatchResult[] = [];

      // Process each form type
      for (const formType of formTypes) {
        const fileKey = `${formType}File`;
        const csvFile = uploadedFiles[fileKey] as fileUpload.UploadedFile | undefined;

        if (!csvFile) {
          batchResults.push({
            formType,
            totalRows: 0,
            imported: 0,
            failed: 0,
            errors: [{ row: 0, reason: "File not uploaded" }],
          });
          continue;
        }

        let rows: any[] = [];
        let headers: string[] = [];

        // Parse CSV
        await new Promise<void>((resolve, reject) => {
          Papa.parse(csvFile.data.toString(), {
            complete: (results: any) => {
              headers = results.data[0] || [];
              rows = results.data.slice(1).filter((row: any[]) => row.some(cell => cell && cell.trim()));
              resolve();
            },
            error: (error: any) => reject(error),
          });
        });

        // Validate and map rows
        const validatedRows = rows.map((row, index) => {
          const rowObj: Record<string, string> = {};
          headers.forEach((header, colIndex) => {
            rowObj[header] = row[colIndex] || "";
          });
          return validateAndMapRow(rowObj, formType, index + 2);
        });

        // Separate valid from invalid
        const validResponses = validatedRows.filter(r => !r.error).map(r => r.data);
        const errors = validatedRows.filter(r => r.error).map((r, index) => ({
          row: index + 2,
          email: rows[index]["Correo electrónico"] || rows[index]["Correo electronico"],
          reason: r.error,
        }));

        // Check student existence and save to Firestore
        let imported = 0;
        const studentErrors: Array<{ row: number; email: string; reason: string }> = [];

        for (let i = 0; i < validResponses.length; i++) {
          const response = validResponses[i];

          try {
            // Check if student exists
            const studentQuery = await db
              .collection("students")
              .where("email", "==", response.email)
              .where("courseId", "==", courseId)
              .limit(1)
              .get();

            if (studentQuery.empty) {
              studentErrors.push({
                row: rows.indexOf(rows[i]) + 2,
                email: response.email,
                reason: `Student with email ${response.email} not found in course ${courseId}`,
              });
              continue;
            }

            const studentId = studentQuery.docs[0].id;

            // Save to sub-collection
            await db
              .collection("students")
              .doc(studentId)
              .collection("formResponses")
              .doc(response.id)
              .set(response);

            imported++;
          } catch (error: any) {
            studentErrors.push({
              row: rows.indexOf(rows[i]) + 2,
              email: response.email,
              reason: `Database error: ${error.message}`,
            });
          }
        }

        batchResults.push({
          formType,
          totalRows: rows.length,
          imported,
          failed: validatedRows.filter(r => r.error).length + studentErrors.length,
          errors: [...errors, ...studentErrors],
        });
      }

      res.json({
        success: true,
        results: batchResults,
        summary: {
          totalImported: batchResults.reduce((sum, r) => sum + r.imported, 0),
          totalFailed: batchResults.reduce((sum, r) => sum + r.failed, 0),
        },
      });
    } catch (error: any) {
      console.error("Error importing batch form responses:", error);
      res.status(500).json({
        error: "Failed to import batch form responses",
        details: error.message,
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
