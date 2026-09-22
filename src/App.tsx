import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, ensureAuth } from './services/firebase';
import { analyzeSessionWithGemini } from './services/gemini';
import type { GameSession, UserStats, AIAnalysisResponse, Exercise, ExerciseResult } from './types/math';
import { generateSessionExercises } from './utils/mathGenerator';

// Componentes
import { KidsHome } from './components/KidsHome';
import { GamePlay } from './components/GamePlay';
import { MatchPairsGame } from './components/MatchPairsGame';
import { SessionSummary } from './components/SessionSummary';
import { ParentsDashboard } from './components/ParentsDashboard';

// Estado inicial pedagógico para niña de 9 años
const defaultStats: UserStats = {
  totalScore: 120,
  totalStars: 15,
  currentStreak: 3,
  highestStreak: 7,
  sessionsCount: 3,
  level: 2,
  accuracyByType: {
    multiplication: { correct: 22, total: 28 },
    addition: { correct: 18, total: 20 },
    subtraction: { correct: 12, total: 18 },
  },
  tableMastery: {
    1: { correct: 10, total: 10, avgTimeMs: 1800 },
    2: { correct: 10, total: 10, avgTimeMs: 2100 },
    3: { correct: 9, total: 10, avgTimeMs: 2500 },
    4: { correct: 8, total: 10, avgTimeMs: 3200 },
    5: { correct: 10, total: 10, avgTimeMs: 1900 },
    6: { correct: 7, total: 10, avgTimeMs: 4100 },
    7: { correct: 5, total: 10, avgTimeMs: 5800 },
    8: { correct: 4, total: 10, avgTimeMs: 6200 },
    9: { correct: 6, total: 10, avgTimeMs: 4900 },
    10: { correct: 10, total: 10, avgTimeMs: 2300 },
    11: { correct: 9, total: 10, avgTimeMs: 3400 },
    12: { correct: 5, total: 10, avgTimeMs: 6500 },
  },
  weakCategories: ['mult-7', 'mult-8', 'sub-regroup'],
  aiRecommendations: {
    summary: '¡Sofía, vas genial con las tablas del 2, 3 y 5! Reforzaremos con trucos divertidos las tablas del 7 y 8 y las restas donde pedimos prestado.',
    suggestedFocus: ['Tabla del 7', 'Tabla del 8', 'Restas con reserva'],
    motivationalQuote: '¡Eres una superheroína, Sofía! 🌟',
    generatedAt: Date.now()
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'match_pairs' | 'summary' | 'parents'>('home');
  const [userStats, setUserStats] = useState<UserStats>(defaultStats);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSessionMode, setCurrentSessionMode] = useState<'adventure' | 'multiplication' | 'addition' | 'subtraction' | 'ai_recommended' | 'drag_drop' | 'match_pairs'>('adventure');
  const [currentSessionTable, setCurrentSessionTable] = useState<number | undefined>(undefined);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [lastFinishedSession, setLastFinishedSession] = useState<GameSession | null>(null);
  const [lastAiAnalysis, setLastAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Configuración de juego
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  // Inicialización y persistencia con Firebase Firestore
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    async function initFirebaseSync() {
      try {
        const user = await ensureAuth();
        const userId = user?.uid || 'default_child_profile';

        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          await setDoc(userDocRef, defaultStats);
        } else {
          setUserStats(userSnap.data() as UserStats);
        }

        unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserStats(snapshot.data() as UserStats);
          }
        });
      } catch (err) {
        console.warn('Uso de almacenamiento local mientras se sincroniza Firebase:', err);
      }
    }

    initFirebaseSync();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Iniciar una ronda de juego según el modo seleccionado
  const handleStartMode = (
    mode: 'adventure' | 'multiplication' | 'addition' | 'subtraction' | 'ai_recommended' | 'drag_drop' | 'match_pairs',
    table?: number
  ) => {
    setCurrentSessionMode(mode);
    setCurrentSessionTable(table);

    if (mode === 'match_pairs') {
      setCurrentView('match_pairs');
    } else {
      const exercises = generateSessionExercises(mode, table, userStats.weakCategories);
      setActiveExercises(exercises);
      setCurrentView('game');
    }
  };

  // Finalizar sesión de ejercicios
  const handleFinishSession = async (results: ExerciseResult[]) => {
    const totalExercises = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const avgTimeSpentMs = Math.round(
      results.reduce((acc, r) => acc + r.timeSpentMs, 0) / Math.max(1, totalExercises)
    );
    const score = correctCount * 10;
    const starsEarned = Math.max(1, correctCount);

    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      timestamp: Date.now(),
      mode: currentSessionMode,
      selectedTable: currentSessionTable,
      totalExercises,
      correctCount,
      score,
      starsEarned,
      avgTimeSpentMs,
      results,
    };

    setLastFinishedSession(newSession);
    setSessions((prev) => [...prev, newSession]);
    setCurrentView('summary');
    setIsLoadingAi(true);

    // Actualización de estadísticas
    const updatedStats = { ...userStats };
    updatedStats.totalScore += score;
    updatedStats.totalStars += starsEarned;
    updatedStats.sessionsCount += 1;
    if (correctCount >= 6) {
      updatedStats.currentStreak += 1;
      if (updatedStats.currentStreak > updatedStats.highestStreak) {
        updatedStats.highestStreak = updatedStats.currentStreak;
      }
    } else {
      updatedStats.currentStreak = 0;
    }
    updatedStats.level = Math.floor(updatedStats.totalStars / 20) + 1;

    // Actualizar desglose de operaciones
    results.forEach((r) => {
      const typeStats = updatedStats.accuracyByType[r.type];
      if (typeStats) {
        typeStats.total += 1;
        if (r.isCorrect) typeStats.correct += 1;
      }

      if (r.type === 'multiplication' && r.num1 >= 1 && r.num1 <= 12) {
        if (!updatedStats.tableMastery[r.num1]) {
          updatedStats.tableMastery[r.num1] = { correct: 0, total: 0, avgTimeMs: 0 };
        }
        const t = updatedStats.tableMastery[r.num1];
        t.total += 1;
        if (r.isCorrect) t.correct += 1;
        t.avgTimeMs = Math.round((t.avgTimeMs + r.timeSpentMs) / 2);
      }
    });

    // Detectar categorías débiles
    const weakList: string[] = [];
    Object.entries(updatedStats.tableMastery).forEach(([tableKey, data]) => {
      if (data.total >= 3 && data.correct / data.total < 0.7) {
        weakList.push(`mult-${tableKey}`);
      }
    });
    if (updatedStats.accuracyByType.subtraction.total >= 5 && updatedStats.accuracyByType.subtraction.correct / updatedStats.accuracyByType.subtraction.total < 0.7) {
      weakList.push('sub-regroup');
    }
    updatedStats.weakCategories = weakList.length > 0 ? weakList : ['mult-7', 'mult-8'];

    setUserStats(updatedStats);

    // Sincronizar en Firestore
    try {
      const user = auth.currentUser;
      const userId = user?.uid || 'default_child_profile';
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, updatedStats, { merge: true });

      const sessionDocRef = doc(db, 'users', userId, 'sessions', newSession.id);
      await setDoc(sessionDocRef, newSession);
    } catch (err) {
      console.warn('Error al sincronizar con Firestore:', err);
    }

    // Análisis Adaptativo con Gemini API
    try {
      const analysis = await analyzeSessionWithGemini(newSession, updatedStats, geminiApiKey);
      setLastAiAnalysis(analysis);

      updatedStats.aiRecommendations = {
        summary: analysis.summary,
        suggestedFocus: analysis.weaknesses,
        motivationalQuote: analysis.motivationalMessage,
        generatedAt: Date.now(),
      };
      setUserStats(updatedStats);

      try {
        const user = auth.currentUser;
        const userId = user?.uid || 'default_child_profile';
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { aiRecommendations: updatedStats.aiRecommendations }, { merge: true });
      } catch {
        // Silencio en caso de red offline
      }
    } catch (err) {
      console.warn('Error en análisis Gemini:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getModeTitle = () => {
    if (currentSessionMode === 'adventure') return '🚀 Gran Aventura';
    if (currentSessionMode === 'drag_drop') return '✋ Arrastra al Resultado';
    if (currentSessionMode === 'match_pairs') return '🧩 Parejas Mágicas';
    if (currentSessionMode === 'multiplication') return `✖️ Tabla del ${currentSessionTable || 'Mixta'}`;
    if (currentSessionMode === 'addition') return '➕ Sumas Divertidas';
    if (currentSessionMode === 'subtraction') return '➖ Restas con Reserva';
    return '✨ Reto Adaptativo Gemini';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 text-slate-800 font-sans pb-12 selection:bg-pink-300 selection:text-pink-900">
      {currentView === 'home' && (
        <KidsHome
          userStats={userStats}
          onStartMode={handleStartMode}
          onOpenParents={() => setCurrentView('parents')}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled((prev) => !prev)}
        />
      )}

      {currentView === 'game' && (
        <GamePlay
          exercises={activeExercises}
          modeName={getModeTitle()}
          timerEnabled={timerEnabled}
          onFinishSession={handleFinishSession}
          onExit={() => setCurrentView('home')}
        />
      )}

      {currentView === 'match_pairs' && (
        <MatchPairsGame
          onFinishSession={handleFinishSession}
          onExit={() => setCurrentView('home')}
        />
      )}

      {currentView === 'summary' && lastFinishedSession && (
        <SessionSummary
          session={lastFinishedSession}
          aiAnalysis={lastAiAnalysis}
          isLoadingAi={isLoadingAi}
          onPlayAgain={() => handleStartMode(currentSessionMode, currentSessionTable)}
          onGoHome={() => setCurrentView('home')}
        />
      )}

      {currentView === 'parents' && (
        <ParentsDashboard
          sessions={sessions}
          userStats={userStats}
          onBack={() => setCurrentView('home')}
          geminiApiKey={geminiApiKey}
          onUpdateApiKey={setGeminiApiKey}
        />
      )}
    </main>
  );
}
