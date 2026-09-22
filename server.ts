import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper para inicialización lazy del cliente Gemini con la variable inyectada en el servidor
  function getGeminiClient(customApiKey?: string): GoogleGenAI {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno del servidor.');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  // API 1: Analizar la sesión de juego de la niña
  app.post('/api/gemini/analyze-session', async (req, res) => {
    try {
      const { session, userStats, customApiKey } = req.body;
      const ai = getGeminiClient(customApiKey);

      const errors = session?.results?.filter((r: { isCorrect: boolean }) => !r.isCorrect) || [];
      const slowOperations = session?.results?.filter((r: { timeSpentMs: number; isCorrect: boolean }) => r.timeSpentMs > 7000 && r.isCorrect) || [];

      const prompt = `
Eres un tutor de matemáticas infantil de élite, pedagógico, cariñoso y adaptativo para Sofía, una niña de 9 años en 3º/4º de primaria.
Dirígete a ella por su nombre ("Sofía") de manera cálida, motivadora y alegre.
Analiza su última sesión de juego matemático y su perfil histórico.

Información de la sesión:
- Modo de juego: ${session?.mode} ${session?.selectedTable ? `(Tabla del ${session?.selectedTable})` : ''}
- Aciertos: ${session?.correctCount} de ${session?.totalExercises}
- Tiempo promedio de respuesta: ${(session?.avgTimeSpentMs / 1000).toFixed(1)} segundos
- Errores cometidos (${errors.length}):
${errors.map((e: { prompt: string; userAnswer: number; correctAnswer: number; timeSpentMs: number; type: string }) => `  * Operación: ${e.prompt}, Respuesta dada: ${e.userAnswer}, Respuesta correcta: ${e.correctAnswer}, Tiempo: ${(e.timeSpentMs/1000).toFixed(1)}s, Tipo: ${e.type}`).join('\n') || '  * ¡Cero errores! Todo perfecto.'}
- Operaciones correctas pero lentas/dudosas:
${slowOperations.map((s: { prompt: string; timeSpentMs: number }) => `  * Operación: ${s.prompt} tardó ${(s.timeSpentMs/1000).toFixed(1)}s`).join('\n') || '  * Ninguna, respondió con agilidad.'}

Estadísticas globales:
- Racha actual: ${userStats?.currentStreak ?? 0}
- Precisión Multiplicación: ${userStats?.accuracyByType?.multiplication?.correct ?? 0}/${userStats?.accuracyByType?.multiplication?.total || 1}
- Precisión Sumas: ${userStats?.accuracyByType?.addition?.correct ?? 0}/${userStats?.accuracyByType?.addition?.total || 1}
- Precisión Restas: ${userStats?.accuracyByType?.subtraction?.correct ?? 0}/${userStats?.accuracyByType?.subtraction?.total || 1}

Genera un objeto JSON con:
1. "summary": Resumen amigable y motivador para la niña o los padres en 2 oraciones.
2. "strengths": Array de 2-3 fortalezas destacadas (ej: "Dominio rápido de la tabla del 5", "Buena concentración en sumas").
3. "weaknesses": Array de 1-3 aspectos que requieren refuerzo específico (ej: "Restas con reserva", "Tabla del 7 y del 8").
4. "recommendedDrills": Array de 2-3 sugerencias concretas para la siguiente ronda.
5. "motivationalMessage": Frase corta, cálida y entusiasta de felicitación/ánimo.
6. "suggestedExercises": Lista de 4 operaciones prioritarias para su próxima ronda con los números 'num1', 'num2', tipo ('multiplication', 'addition', o 'subtraction') y una breve razón.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedDrills: { type: Type.ARRAY, items: { type: Type.STRING } },
              motivationalMessage: { type: Type.STRING },
              suggestedExercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    num1: { type: Type.INTEGER },
                    num2: { type: Type.INTEGER },
                    reason: { type: Type.STRING }
                  },
                  required: ['type', 'num1', 'num2']
                }
              }
            },
            required: ['summary', 'strengths', 'weaknesses', 'recommendedDrills', 'motivationalMessage']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error en /api/gemini/analyze-session:', errorMessage);
      return res.status(500).json({ error: errorMessage });
    }
  });

  // API 2: Generar Reporte Pedagógico Semanal para Padres
  app.post('/api/gemini/parent-report', async (req, res) => {
    try {
      const { sessions, userStats, customApiKey } = req.body;
      const ai = getGeminiClient(customApiKey);

      const totalExercises = sessions?.reduce((acc: number, s: { totalExercises: number }) => acc + s.totalExercises, 0) || 0;
      const totalCorrect = sessions?.reduce((acc: number, s: { correctCount: number }) => acc + s.correctCount, 0) || 0;
      const avgAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 100;

      const prompt = `
Actúa como un pedagogo infantil y profesor de matemáticas. Redacta un reporte semanal estructurado y detallado para los padres de Sofía, una niña de 9 años, sobre su progreso con la app "Aventura Matemática". Menciona a Sofía por su nombre en el análisis.

Datos del progreso:
- Sesiones completadas: ${sessions?.length || 0}
- Total ejercicios resueltos: ${totalExercises}
- Precisión global: ${avgAccuracy}%
- Estrellas acumuladas: ${userStats?.totalStars ?? 0}
- Racha máxima: ${userStats?.highestStreak ?? 0}
- Rendimiento por área:
  * Tablas de Multiplicar: ${userStats?.accuracyByType?.multiplication?.correct ?? 0}/${userStats?.accuracyByType?.multiplication?.total || 1}
  * Sumas: ${userStats?.accuracyByType?.addition?.correct ?? 0}/${userStats?.accuracyByType?.addition?.total || 1}
  * Restas: ${userStats?.accuracyByType?.subtraction?.correct ?? 0}/${userStats?.accuracyByType?.subtraction?.total || 1}
- Tablas con menor efectividad o mayor tiempo: ${userStats?.weakCategories?.join(', ') || 'Todas muestran buen ritmo'}

Instrucciones:
- Redacta en español formal pero afectuoso y claro.
- Incluye:
  1. Resumen Ejecutivo (Visión global del ritmo y compromiso).
  2. Fortalezas Consolidadas (Lo que domina con soltura).
  3. Áreas de Oportunidad y Refuerzo (Ejercicios o tablas que le cuestan más y trucos pedagógicos para practicar en casa).
  4. Plan de Acción Recomendado para la próxima semana (10 minutos diarios).
Usa formato con subtítulos claros y viñetas elegantes.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ report: response.text });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error en /api/gemini/parent-report:', errorMessage);
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Integración de Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Aventura Matemática corriendo en http://localhost:${PORT}`);
  });
}

startServer();
