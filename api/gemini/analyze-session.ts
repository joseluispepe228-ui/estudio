import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI, Type } from '@google/genai';

interface ApiRequest extends IncomingMessage {
  body: {
    session?: any;
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
    const { session, userStats, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const ai = new GoogleGenAI({ apiKey });
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
1. "summary": Resumen amigable y motivador para Sofía o sus padres en 2 oraciones.
2. "strengths": Array de 2-3 fortalezas destacadas.
3. "weaknesses": Array de 1-3 aspectos que requieren refuerzo específico.
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
    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
