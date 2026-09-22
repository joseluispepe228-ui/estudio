import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
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

// Estado inicial limpio desde 0 para el inicio del aprendizaje real de Sofía
export const zeroStats: UserStats = {
  totalScore: 0,
  totalStars: 0,
  currentStreak: 0,
  highestStreak: 0,
  sessionsCount: 0,
  level: 1,
  accuracyByType: {
    multiplication: { correct: 0, total: 0 },
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
  },
  tableMastery: {
    1: { correct: 0, total: 0, avgTimeMs: 0 },
    2: { correct: 0, total: 0, avgTimeMs: 0 },
    3: { correct: 0, total: 0, avgTimeMs: 0 },
    4: { correct: 0, total: 0, avgTimeMs: 0 },
    5: { correct: 0, total: 0, avgTimeMs: 0 },
    6: { correct: 0, total: 0, avgTimeMs: 0 },
    7: { correct: 0, total: 0, avgTimeMs: 0 },
    8: { correct: 0, total: 0, avgTimeMs: 0 },
    9: { correct: 0, total: 0, avgTimeMs: 0 },
    10: { correct: 0, total: 0, avgTimeMs: 0 },
    11: { correct: 0, total: 0, avgTimeMs: 0 },
    12: { correct: 0, total: 0, avgTimeMs: 0 },
  },
  weakCategories: [],
  aiRecommendations: {
    summary: '¡Hola Sofía! Empieza jugando en la Gran Aventura o practicando tu tabla favorita para desbloquear trucos personalizados.',
    suggestedFocus: ['Gran Aventura', 'Tabla del 2'],
    motivationalQuote: '¡Bienvenida a tu aventura matemática, Sofía! 🌟',
    generatedAt: Date.now()
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'match_pairs' | 'summary' | 'parents'>('home');
  const [userStats, setUserStats] = useState<UserStats>(zeroStats);
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
    let unsubscribeSessions: (() => void) | undefined;

    async function initFirebaseSync() {
      try {
        const user = await ensureAuth();
        const userId = user?.uid || 'default_child_profile';

        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          await setDoc(userDocRef, zeroStats);
        } else {
          setUserStats(userSnap.data() as UserStats);
        }

        unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserStats(snapshot.data() as UserStats);
          }
        });

        // Escuchar sesiones en tiempo real
        const sessionsRef = collection(db, 'users', userId, 'sessions');
        const q = query(sessionsRef, orderBy('timestamp', 'asc'), limit(50));
        unsubscribeSessions = onSnapshot(q, (snapshot) => {
          const loadedSessions: GameSession[] = [];
          snapshot.forEach((d) => {
            loadedSessions.push(d.data() as GameSession);
          });
          setSessions(loadedSessions);
        });
      } catch (err) {
        console.warn('Uso de almacenamiento local mientras se sincroniza Firebase:', err);
      }
    }

    initFirebaseSync();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSessions) unsubscribeSessions();
    };
  }, []);

  // Función para reiniciar todas las estadísticas a 0 (para padres)
  const handleResetData = async () => {
    setUserStats(zeroStats);
    setSessions([]);
    setLastFinishedSession(null);
    setLastAiAnalysis(null);

    try {
      const user = auth.currentUser;
      const userId = user?.uid || 'default_child_profile';
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, zeroStats);

      // Borrar sesiones previas de prueba en Firestore
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const snaps = await getDocs(sessionsRef);
      const deletePromises = snaps.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Error al reiniciar en Firestore:', err);
    }
  };

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
          onResetData={handleResetData}
        />
      )}
    </main>
  );
}
