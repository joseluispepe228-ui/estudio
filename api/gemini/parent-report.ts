import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

interface ApiRequest extends IncomingMessage {
  body: {
    sessions?: any[];
    userStats?: any;
    customApiKey?: string;
  };
}

interface ApiResponse extends ServerResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessions, userStats, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const ai = new GoogleGenAI({ apiKey });
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
  1. Resumen Ejecutivo (Visión global del ritmo y compromiso de Sofía).
  2. Fortalezas Consolidadas (Lo que domina con soltura).
  3. Áreas de Oportunidad y Refuerzo (Ejercicios o tablas que le cuestan más y trucos pedagógicos para practicar en casa).
  4. Plan de Acción Recomendado para la próxima semana (10 minutos diarios).
Usa formato con subtítulos claros y viñetas elegantes.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json({ report: response.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
