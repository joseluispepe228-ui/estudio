export interface Exercise {
  id: string;
  type: 'multiplication' | 'addition' | 'subtraction';
  num1: number;
  num2: number;
  operator: string;
  correctAnswer: number;
  options: number[]; // 4 opciones para botones táctiles
  hasRegrouping?: boolean; // Para restas con reserva o sumas llevando
  categoryKey: string; // ej. "mult-7", "add-2digit", "sub-regroup", "word-problem", "repeated-sum"
  interactionStyle?: 'multiple_choice' | 'drag_and_drop' | 'missing_factor' | 'visual_blocks';
  layout?: 'horizontal' | 'vertical'; // Diseño vertical para sumas y restas con valor posicional
  // Nuevos campos para problemas matemáticos contextuales y modelos visuales (basado en el cuaderno de Sofía)
  contextQuestion?: {
    story: string; // El problema contextualizado (ej. "La tía Flor recolecta 22 ciruelas cada día...")
    subQuestion?: string; // "¿Cuántas ciruelas recolectó en 4 días?"
    unitLabel?: string; // "ciruelas", "monedas", "dulces", "autos", "huevos", "litros"
    iconName?: 'fruit' | 'coin' | 'candy' | 'car' | 'milk' | 'flower' | 'island' | 'books';
    visualHint?: string; // Descripción didáctica o pista visual
  };
  // Para ejercicios con reagrupación por pasos (Práctica 2: unidades, decenas, centenas)
  regroupingSteps?: {
    step1Prompt: string; // ej. "Multiplica unidades: 7 × 8 = 56 unidades = 5 decenas y 6 unidades"
    step2Prompt: string; // ej. "Multiplica decenas: 7 × 1 = 7 decenas"
    step3Prompt: string; // ej. "Suma decenas: 7 decenas + 5 decenas = 12 decenas"
  };
}

// Tipo para el minijuego de Parejas Mágicas (Memory Match)
export interface MatchCard {
  id: string;
  pairId: string;
  content: string; // ej. "7 × 8" o "56"
  isExpression: boolean;
  isMatched: boolean;
}

export interface ExerciseResult {
  exerciseId: string;
  type: 'multiplication' | 'addition' | 'subtraction';
  prompt: string;
  num1: number;
  num2: number;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpentMs: number;
  categoryKey: string;
}

export interface GameSession {
  id: string;
  timestamp: number;
  endedAt?: number;
  durationSeconds?: number;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  timeOfDayLabel?: string; // ej. "08:35 AM"
  mode:
    | 'adventure'
    | 'multiplication'
    | 'addition'
    | 'subtraction'
    | 'ai_recommended'
    | 'drag_drop'
    | 'match_pairs'
    | 'word_problems'
    | 'regrouping_mult'
    | 'island_treasure';
  selectedTable?: number; // si practicó tabla específica
  totalExercises: number;
  correctCount: number;
  score: number;
  starsEarned: number;
  avgTimeSpentMs: number;
  results: ExerciseResult[];
  adaptiveFeedback?: string;
  focusAreasIdentified?: string[];
}

export interface UserStats {
  totalScore: number;
  totalStars: number;
  currentStreak: number;
  highestStreak: number;
  sessionsCount: number;
  lastPlayedDate?: string;
  lastPlayedTime?: string; // Hora exacta del último uso (ej: "15:42")
  level: number;
  // Desglose de precisión
  accuracyByType: {
    multiplication: { correct: number; total: number };
    addition: { correct: number; total: number };
    subtraction: { correct: number; total: number };
  };
  // Desglose por tabla de multiplicar (1..12)
  tableMastery: Record<number, { correct: number; total: number; avgTimeMs: number }>;
  weakCategories: string[]; // ['mult-8', 'sub-regroup', etc.]
  aiRecommendations?: {
    summary: string;
    suggestedFocus: string[];
    motivationalQuote: string;
    generatedAt: number;
  };
}

export interface AIAnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedDrills: string[];
  motivationalMessage: string;
  suggestedExercises?: {
    type: 'multiplication' | 'addition' | 'subtraction';
    num1: number;
    num2: number;
    reason: string;
  }[];
}
