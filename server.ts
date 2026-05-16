import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const API_PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini API setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
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

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = result.text || "";
      
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

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      res.json({ summary: result.text });
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

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      res.json({ report: result.text });
    } catch (error: any) {
      console.error("AI Report Generation Error:", error);
      res.status(500).json({ error: error.message });
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
