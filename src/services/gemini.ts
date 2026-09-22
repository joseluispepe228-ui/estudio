import type { GameSession, UserStats, AIAnalysisResponse } from '../types/math';

export async function analyzeSessionWithGemini(
  session: GameSession,
  userStats: UserStats,
  customApiKey?: string
): Promise<AIAnalysisResponse> {
  try {
    const res = await fetch('/api/gemini/analyze-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session,
        userStats,
        customApiKey: customApiKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.summary) {
        return data as AIAnalysisResponse;
      }
    }
    console.warn('La API de Gemini en servidor respondió con error o formato incompleto. Activando motor heurístico local.');
    return generateLocalAdaptiveAnalysis(session, userStats);
  } catch (err) {
    console.warn('No se pudo conectar al endpoint de Gemini, activando motor heurístico local:', err);
    return generateLocalAdaptiveAnalysis(session, userStats);
  }
}

// Generador de informe semanal para padres
export async function generateParentReportWithGemini(
  sessions: GameSession[],
  userStats: UserStats,
  customApiKey?: string
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/parent-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessions,
        userStats,
        customApiKey: customApiKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.report) {
        return data.report;
      }
    }
    console.warn('La API de Gemini en servidor no pudo generar el reporte. Usando motor pedagógico local.');
    return generateLocalParentReport(sessions, userStats);
  } catch (err) {
    console.warn('Error en la llamada al servidor de Gemini:', err);
    return generateLocalParentReport(sessions, userStats);
  }
}

// Respaldo heurístico pedagógico local (garantiza que la niña nunca vea errores de red)
function generateLocalAdaptiveAnalysis(session: GameSession, userStats: UserStats): AIAnalysisResponse {
  const errors = session.results.filter(r => !r.isCorrect);
  const accuracy = Math.round((session.correctCount / Math.max(1, session.totalExercises)) * 100);

  const weaknesses: string[] = [];
  const strengths: string[] = [];

  if (errors.length === 0) {
    strengths.push('¡Ronda impecable con 100% de precisión!');
    strengths.push('Excelente velocidad y seguridad en las respuestas.');
  } else {
    const multErrors = errors.filter(e => e.type === 'multiplication');
    const subErrors = errors.filter(e => e.type === 'subtraction');
    const addErrors = errors.filter(e => e.type === 'addition');

    if (multErrors.length > 0) {
      const tables = multErrors.map(e => `${e.num1}x${e.num2}`).join(', ');
      weaknesses.push(`Multiplicaciones complejas: ${tables}`);
    }
    if (subErrors.length > 0) {
      weaknesses.push('Restas con reserva o números de dos dígitos');
    }
    if (addErrors.length > 0) {
      weaknesses.push('Sumas con llevadas');
    }

    if (session.correctCount > 0) {
      strengths.push(`Acertó ${session.correctCount} de ${session.totalExercises} desafíos.`);
    }
  }

  const drills: string[] = [];
  if (weaknesses.length > 0) {
    drills.push(`Hacer una ronda de refuerzo enfocada en: ${weaknesses[0]}`);
    drills.push('Tomar 2 segundos adicionales antes de presionar la respuesta para verificar mentalmente');
  } else {
    drills.push('Subir a sumas y restas de 3 dígitos');
    drills.push('Intentar el reto contrarreloj de las tablas del 7, 8 y 9');
  }

  return {
    summary: accuracy >= 80
      ? `¡Fantástico trabajo! Demostraste gran rapidez y conseguiste un ${accuracy}% de aciertos en esta ronda.`
      : `¡Buen esfuerzo! Completaste la ronda con ${session.correctCount} aciertos. Con un poquito de práctica en las operaciones desafiantes serás imparable.`,
    strengths: strengths.length > 0 ? strengths : ['Constancia y dedicación para completar la ronda de 10 ejercicios'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Ningún error evidente en esta ronda, ¡mantén el ritmo!'],
    recommendedDrills: drills,
    motivationalMessage: accuracy >= 90
      ? '¡Eres una superheroína de las matemáticas! 🌟'
      : '¡Cada error es solo una pista para aprender más rápido! 🚀'
  };
}

function generateLocalParentReport(sessions: GameSession[], userStats: UserStats): string {
  const total = sessions.reduce((a, b) => a + b.totalExercises, 0);
  const correct = sessions.reduce((a, b) => a + b.correctCount, 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

  return `### 📊 Resumen de Progreso Semanal

**1. Desempeño General**
- Total de ejercicios completados: **${total}**
- Precisión global: **${accuracy}%**
- Racha récord: **${userStats.highestStreak}** aciertos consecutivos
- Estrellas doradas acumuladas: **⭐ ${userStats.totalStars}**

**2. Fortalezas Clave**
- Mantiene constancia diaria y entusiasmo por superar niveles.
- Gran fluidez en operaciones de sumas elementales y tablas básicas (2, 5 y 10).

**3. Recomendaciones Pedagógicas**
- Reforzar las tablas intermedias (especialmente 7, 8 y 9) con juegos de memoria o canciones rítmicas.
- En restas con reserva, pedirle que verbalice en voz alta los pasos para afianzar el concepto de pedir prestado a la decena.

**4. Plan Sugerido**
- Sesiones cortas de 10 a 15 minutos diarios intercalando modo aventura y desafíos adaptativos.`;
}
