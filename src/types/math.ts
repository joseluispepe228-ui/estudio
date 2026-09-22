export interface Exercise {
  id: string;
  type: 'multiplication' | 'addition' | 'subtraction';
  num1: number;
  num2: number;
  operator: string;
  correctAnswer: number;
  options: number[]; // 4 opciones para botones táctiles
  hasRegrouping?: boolean; // Para restas con reserva o sumas llevando
  categoryKey: string; // ej. "mult-7", "add-2digit", "sub-regroup"
  interactionStyle?: 'multiple_choice' | 'drag_and_drop' | 'missing_factor' | 'visual_blocks';
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
  mode: 'adventure' | 'multiplication' | 'addition' | 'subtraction' | 'ai_recommended' | 'drag_drop' | 'match_pairs';
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
