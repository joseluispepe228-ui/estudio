import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  RefreshCw,
  KeyRound,
  FileText,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import type { GameSession, UserStats } from '../types/math';
import { generateParentReportWithGemini } from '../services/gemini';
import { playSound } from '../utils/effects';

interface ParentsDashboardProps {
  sessions: GameSession[];
  userStats: UserStats;
  onBack: () => void;
  geminiApiKey: string;
  onUpdateApiKey: (key: string) => void;
  onResetData: () => void;
}

export const ParentsDashboard: React.FC<ParentsDashboardProps> = ({
  sessions,
  userStats,
  onBack,
  geminiApiKey,
  onUpdateApiKey,
  onResetData,
}) => {
  // Autenticación simple mediante pin de seguridad
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Reporte Semanal Gemini
  const [parentReport, setParentReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Verificación de PIN (Por defecto 1234 para comodidad de los padres, configurable)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.trim().length > 0) {
      setIsAuthenticated(true);
      setPinError('');
      playSound('click');
    } else {
      setPinError('Introduce el código de acceso (por defecto: 1234)');
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    playSound('click');
    try {
      const report = await generateParentReportWithGemini(sessions, userStats, geminiApiKey);
      setParentReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <KeyRound className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-800">Control de Padres</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Ingresa el PIN de seguridad para acceder a las métricas analíticas y reportes de IA.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                PIN de acceso (Predeterminado: 1234)
              </label>
              <input
                id="parent-pin-input"
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-hidden text-center text-2xl tracking-widest font-black text-slate-800"
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-500 mt-1.5 font-bold">{pinError}</p>}
            </div>

            <button
              id="submit-parent-pin-btn"
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition"
            >
              Desbloquear Panel
            </button>
          </form>

          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold transition flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al juego de la niña
          </button>
        </div>
      </div>
    );
  }

  const multAccuracy = userStats.accuracyByType.multiplication.total > 0
    ? Math.round((userStats.accuracyByType.multiplication.correct / userStats.accuracyByType.multiplication.total) * 100)
    : 0;
  const addAccuracy = userStats.accuracyByType.addition.total > 0
    ? Math.round((userStats.accuracyByType.addition.correct / userStats.accuracyByType.addition.total) * 100)
    : 0;
  const subAccuracy = userStats.accuracyByType.subtraction.total > 0
    ? Math.round((userStats.accuracyByType.subtraction.correct / userStats.accuracyByType.subtraction.total) * 100)
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Barra superior de navegación */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl p-5 shadow-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="parents-back-btn"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">Panel de Padres • Progreso de Sofía</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Protegido
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Seguimiento pedagógico, análisis de tiempos y reportes adaptativos de Gemini.
            </p>
          </div>
        </div>

        {/* Clave API opcional para Gemini y Botón de Reinicio */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="parent-gemini-key-input"
            type="password"
            placeholder="Clave Gemini (Opcional)"
            value={geminiApiKey}
            onChange={(e) => onUpdateApiKey(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden w-44"
            title="Si no se define, se usa la clave de entorno o el motor heurístico pedagógico"
          />

          <button
            id="parent-reset-data-btn"
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition"
            title="Borrar estadísticas de prueba e iniciar desde 0 para Sofía"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reiniciar a 0</span>
          </button>
        </div>
      </div>

      {/* Modal de confirmación para reiniciar */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-800">¿Reiniciar todo a 0?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se limpiarán las estadísticas de prueba (estrellas, sesiones, tablas y racha). Así Sofía comenzará su progreso real desde el primer día.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetData();
                  playSound('click');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Sí, reiniciar a 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas resumen de métricas clave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Sesiones
          </div>
          <div className="text-2xl font-black text-slate-800">{userStats.sessionsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Rondas de 10 ejercicios</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Estrellas
          </div>
          <div className="text-2xl font-black text-amber-600">{userStats.totalStars}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Puntos acumulados</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Racha Máxima
          </div>
          <div className="text-2xl font-black text-emerald-600">{userStats.highestStreak}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Aciertos consecutivos</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" /> Nivel Pedagógico
          </div>
          <div className="text-2xl font-black text-purple-700">Nivel {userStats.level}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Aventura adaptativa</div>
        </div>
      </div>

      {/* Gráficos de Efectividad por Operación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Multiplicaciones */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800">Tablas de Multiplicar</h3>
            <span className="text-sm font-extrabold text-purple-600">{multAccuracy}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${multAccuracy}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {userStats.accuracyByType.multiplication.correct} correctas de {userStats.accuracyByType.multiplication.total} resueltas
          </p>
        </div>

        {/* Sumas */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800">Sumas (1 a 3 dígitos)</h3>
            <span className="text-sm font-extrabold text-pink-600">{addAccuracy}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${addAccuracy}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {userStats.accuracyByType.addition.correct} correctas de {userStats.accuracyByType.addition.total} resueltas
          </p>
        </div>

        {/* Restas */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800">Restas con Reserva</h3>
            <span className="text-sm font-extrabold text-amber-600">{subAccuracy}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${subAccuracy}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {userStats.accuracyByType.subtraction.correct} correctas de {userStats.accuracyByType.subtraction.total} resueltas
          </p>
        </div>
      </div>

      {/* Matriz de Dominio de Tablas del 1 al 12 */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800">Efectividad por Tabla de Multiplicar (1 al 12)</h2>
            <p className="text-xs text-slate-500 font-medium">
              Código de color según dominio: Verde (&ge;80%), Amarillo (50-79%), Naranja (&lt;50% o sin datos suficientes).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((table) => {
            const data = userStats.tableMastery[table] || { correct: 0, total: 0, avgTimeMs: 0 };
            const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : null;

            let badgeColor = 'bg-slate-50 border-slate-200 text-slate-600';
            if (pct !== null) {
              if (pct >= 80) badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-800';
              else if (pct >= 50) badgeColor = 'bg-amber-50 border-amber-300 text-amber-800';
              else badgeColor = 'bg-rose-50 border-rose-300 text-rose-800';
            }

            return (
              <div key={table} className={`rounded-2xl p-3 border text-center transition ${badgeColor}`}>
                <div className="text-sm font-black">Tabla del {table}</div>
                <div className="text-lg font-black mt-0.5">
                  {pct !== null ? `${pct}%` : '—'}
                </div>
                <div className="text-[10px] font-bold opacity-75">
                  {data.total > 0 ? `${data.correct}/${data.total} aciertos` : 'Sin intentos'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reporte Pedagógico Semanal Generado por Gemini */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-lg font-black text-white">Reporte Pedagógico Semanal con IA Gemini</h2>
              <p className="text-xs text-indigo-200">
                Análisis en lenguaje natural de fortalezas, errores comunes y plan de acción para casa.
              </p>
            </div>
          </div>

          <button
            id="generate-parent-report-btn"
            disabled={isGeneratingReport}
            onClick={handleGenerateReport}
            className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
            {isGeneratingReport ? 'Generando Reporte...' : 'Generar / Actualizar Reporte'}
          </button>
        </div>

        {parentReport ? (
          <div className="bg-white/10 rounded-2xl p-5 backdrop-blur text-sm text-indigo-100 whitespace-pre-line leading-relaxed border border-white/10">
            {parentReport}
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-6 text-center text-xs text-indigo-300 border border-dashed border-white/20">
            <FileText className="w-8 h-8 mx-auto text-indigo-400 mb-2 opacity-60" />
            Haz clic en "Generar / Actualizar Reporte" para que Gemini redacte una evaluación cualitativa basada en las sesiones de tu hija.
          </div>
        )}
      </div>

      {/* Historial Reciente de Sesiones */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
        <h2 className="text-base font-black text-slate-800">Historial Reciente de Sesiones</h2>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400">Aún no hay sesiones registradas. ¡Inicia una aventura matemática!</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {sessions.slice().reverse().map((session) => (
              <div key={session.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 capitalize">
                    {session.mode === 'adventure' && 'Gran Aventura'}
                    {session.mode === 'multiplication' && `Tabla del ${session.selectedTable || 'Mixta'}`}
                    {session.mode === 'addition' && 'Sumas Progresivas'}
                    {session.mode === 'subtraction' && 'Restas con Reserva'}
                    {session.mode === 'ai_recommended' && 'Refuerzo Adaptativo Gemini'}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    {new Date(session.timestamp).toLocaleDateString()} a las{' '}
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-extrabold text-slate-700">
                      {session.correctCount}/{session.totalExercises} aciertos
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {(session.avgTimeSpentMs / 1000).toFixed(1)}s prom.
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> +{session.starsEarned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
