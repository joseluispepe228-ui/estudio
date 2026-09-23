import React, { useEffect } from 'react';
import { Trophy, Star, Sparkles, RotateCcw, Home, Clock, Target, Compass } from 'lucide-react';
import type { GameSession, AIAnalysisResponse } from '../types/math';
import { fireSuperCelebration, playSound } from '../utils/effects';

interface SessionSummaryProps {
  session: GameSession;
  aiAnalysis: AIAnalysisResponse | null;
  isLoadingAi: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  aiAnalysis,
  isLoadingAi,
  onPlayAgain,
  onGoHome,
}) => {
  useEffect(() => {
    fireSuperCelebration();
    playSound('victory');
  }, []);

  const percentage = Math.round((session.correctCount / Math.max(1, session.totalExercises)) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Cabecera de Victoria */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-pink-100 text-center relative overflow-hidden">
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-xl mb-3 animate-bounce">
          <Trophy className="w-12 h-12 text-yellow-950" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-800">
          ¡Excelente ronda, Sofía!
        </h1>
        <p className="text-base text-purple-600 font-bold mt-1">
          ¡Has ganado {session.starsEarned} estrellas doradas! ⭐
        </p>

        {/* Revelación de la palabra si jugó la Isla del Tesoro */}
        {session.mode === 'island_treasure' && session.islandDiscoveredWord && (
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-yellow-200">
              <Compass className="w-4 h-4" /> ¡Palabra Secreta Descifrada del Tesoro!
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-widest text-yellow-300 font-mono">
              [ {session.islandDiscoveredWord} ]
            </div>
            <p className="text-xs text-teal-100">
              ¡Has abierto todos los cofres del enigma! En la próxima partida descubrirás una palabra diferente.
            </p>
          </div>
        )}

        {/* Métricas destacadas */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-purple-50 rounded-2xl p-3 text-center border border-purple-100">
            <Target className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <div className="text-2xl font-black text-purple-950">{percentage}%</div>
            <div className="text-xs font-bold text-purple-600">Precisión</div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
            <Star className="w-5 h-5 mx-auto text-amber-500 fill-amber-400 mb-1" />
            <div className="text-2xl font-black text-amber-950">{session.correctCount}/{session.totalExercises}</div>
            <div className="text-xs font-bold text-amber-700">Aciertos</div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-3 text-center border border-indigo-100">
            <Clock className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
            <div className="text-2xl font-black text-indigo-950">{(session.avgTimeSpentMs / 1000).toFixed(1)}s</div>
            <div className="text-xs font-bold text-indigo-600">Tiempo Medio</div>
          </div>
        </div>

        {/* Módulo Adaptativo de Gemini en Vivo */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white rounded-2xl p-5 text-left relative overflow-hidden shadow-inner">
          <div className="flex items-center gap-2 text-yellow-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Diagnóstico del Tutor Gemini
          </div>

          {isLoadingAi ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-yellow-300 rounded-full animate-spin" />
              <p className="text-xs text-purple-200 font-medium">Gemini está analizando tus respuestas y preparando consejos...</p>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-3">
              <p className="text-sm md:text-base font-semibold text-purple-100 leading-relaxed">
                "{aiAnalysis.motivationalMessage}"
              </p>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur text-xs space-y-1.5">
                <p className="font-bold text-yellow-300">💡 Resumen de aprendizaje:</p>
                <p className="text-purple-200">{aiAnalysis.summary}</p>
                {aiAnalysis.weaknesses.length > 0 && (
                  <p className="text-pink-300 font-medium">
                    🎯 Refuerzo sugerido para próxima ronda: {aiAnalysis.weaknesses.join(' • ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-purple-200">
              ¡Gran avance! Tus respuestas han quedado registradas en Firestore.
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción inferior */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          id="go-home-btn"
          onClick={() => {
            playSound('click');
            onGoHome();
          }}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" /> Volver al Menú
        </button>

        <button
          id="play-again-btn"
          onClick={() => {
            playSound('click');
            onPlayAgain();
          }}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> ¡Jugar Otra Ronda!
        </button>
      </div>
    </div>
  );
};
