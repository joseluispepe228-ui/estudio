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
  // Campos para problemas matemáticos contextuales y modelos visuales (basado en el cuaderno de Sofía)
  contextQuestion?: {
    story: string; // El problema contextualizado
    subQuestion?: string;
    unitLabel?: string;
    iconName?: 'fruit' | 'coin' | 'candy' | 'car' | 'milk' | 'flower' | 'island' | 'books';
    visualHint?: string;
    // Datos específicos del juego de la Isla del Tesoro
    islandData?: {
      targetWord: string; // ej: "CHILOE", "MAGALLANES", "EASTER", etc.
      themeName: string; // ej: "Isla de Chiloé 🏰", "Isla de Pascua 🗿"
      letter: string; // La letra de este cofre
      letterIndex: number; // Posición de la letra (0-indexed)
      totalLetters: number;
    };
  };
  // Para ejercicios con reagrupación por pasos (Práctica 2: unidades, decenas, centenas)
  regroupingSteps?: {
    step1Prompt: string;
    step2Prompt: string;
    step3Prompt: string;
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
  timeOfDayLabel?: string;
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
  selectedTable?: number;
  totalExercises: number;
  correctCount: number;
  score: number;
  starsEarned: number;
  avgTimeSpentMs: number;
  results: ExerciseResult[];
  adaptiveFeedback?: string;
  focusAreasIdentified?: string[];
  // Si fue modo isla del tesoro, la palabra descifrada
  islandDiscoveredWord?: string;
}

export interface UserStats {
  totalScore: number;
  totalStars: number;
  currentStreak: number;
  highestStreak: number;
  sessionsCount: number;
  lastPlayedDate?: string;
  lastPlayedTime?: string;
  level: number;
  accuracyByType: {
    multiplication: { correct: number; total: number };
    addition: { correct: number; total: number };
    subtraction: { correct: number; total: number };
  };
  tableMastery: Record<number, { correct: number; total: number; avgTimeMs: number }>;
  weakCategories: string[];
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
