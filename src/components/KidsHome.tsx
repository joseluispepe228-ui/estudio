import React, { useState, useEffect } from 'react';
import { Play, Flame, Star, Sparkles, Volume2, VolumeX, Timer, ChevronRight, Hand, Puzzle, Download, Smartphone } from 'lucide-react';
import type { UserStats } from '../types/math';
import { playSound } from '../utils/effects';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface KidsHomeProps {
  userStats: UserStats;
  onStartMode: (mode: 'adventure' | 'multiplication' | 'addition' | 'subtraction' | 'ai_recommended' | 'drag_drop' | 'match_pairs', table?: number) => void;
  onOpenParents: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  timerEnabled: boolean;
  onToggleTimer: () => void;
}

export const KidsHome: React.FC<KidsHomeProps> = ({
  userStats,
  onStartMode,
  onOpenParents,
  soundEnabled,
  onToggleSound,
  timerEnabled,
  onToggleTimer,
}) => {
  const [selectedTable, setSelectedTable] = useState<number>(7);
  const [greeting, setGreeting] = useState<string>('¡Hola, Sofía! 🌸');
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('¡Buenos días, Sofía! ☀️');
    else if (hours < 19) setGreeting('¡Buenas tardes, Sofía! 🚀');
    else setGreeting('¡Buenas noches, Sofía! 🌙');
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Barra superior de bienvenida y gamificación */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur rounded-3xl p-5 shadow-lg border border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-3xl shadow-md transform hover:rotate-6 transition-transform">
            🦄
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {greeting}
            </h1>
            <p className="text-xs md:text-sm text-purple-600 font-bold flex items-center gap-1.5">
              <span>Nivel {userStats.level} Exploradora Cósmica</span>
            </p>
          </div>
        </div>

        {/* Marcadores rápidos */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400 animate-pulse" />
            <span className="font-black text-amber-900 text-sm md:text-base">{userStats.totalStars}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
            <span className="font-black text-orange-950 text-sm md:text-base">{userStats.currentStreak} Racha</span>
          </div>

          <button
            id="toggle-sound-btn"
            onClick={() => {
              onToggleSound();
              playSound('click');
            }}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            aria-label="Alternar sonido"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          <button
            id="toggle-timer-btn"
            onClick={() => {
              onToggleTimer();
              playSound('click');
            }}
            className={`p-2.5 rounded-2xl transition flex items-center gap-1 text-xs font-bold ${
              timerEnabled ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
            }`}
            title="Temporizador de ronda"
            aria-label="Alternar temporizador"
          >
            <Timer className="w-5 h-5" />
            <span className="hidden sm:inline">{timerEnabled ? 'Tiempo ON' : 'Sin prisa'}</span>
          </button>

          {/* Botón PWA: Instalar App */}
          {!isInstalled && (
            <button
              id="install-pwa-header-btn"
              onClick={() => {
                playSound('click');
                promptInstall();
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition transform active:scale-95 animate-pulse"
              title="Instalar como app en tu pantalla de inicio"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
          )}
        </div>
      </header>

      {/* Banner Adaptativo con Recomendación de Gemini */}
      {userStats.aiRecommendations && (
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-3 -bottom-3 text-7xl opacity-20 pointer-events-none">✨</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Tutor Gemini Adaptativo
              </div>
              <h2 className="text-lg md:text-xl font-black">
                {userStats.aiRecommendations.motivationalQuote || '¡Lista para tu siguiente desafío!'}
              </h2>
              <p className="text-sm text-purple-100 max-w-xl leading-relaxed">
                {userStats.aiRecommendations.summary}
              </p>
            </div>
            <button
              id="start-ai-drill-btn"
              onClick={() => {
                playSound('click');
                onStartMode('ai_recommended');
              }}
              className="px-5 py-3.5 rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-black shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-2 whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-purple-700" />
              ¡Entrenar Mi Reto!
            </button>
          </div>
        </div>
      )}

      {/* Botón Gran Aventura Matemática */}
      <div
        onClick={() => {
          playSound('click');
          onStartMode('adventure');
        }}
        id="start-adventure-card"
        className="cursor-pointer group relative bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 active:translate-y-0"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 transition-transform">
              🚀
            </div>
            <div>
              <span className="bg-yellow-300 text-yellow-950 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado • 10 Desafíos
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-1">
                Gran Aventura de Matemáticas
              </h2>
              <p className="text-sm text-emerald-50 max-w-md mt-1 font-medium">
                Una mezcla mágica de multiplicaciones, sumas veloces y restas con trucos. ¡Gana 10 estrellas doradas!
              </p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg group-hover:bg-yellow-300 group-hover:text-yellow-900 transition">
            <ChevronRight className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* NUEVAS MODALIDADES DIDÁCTICAS E INTERACTIVAS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-black text-slate-800">Nuevos Juegos y Dinámicas Didácticas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Modo 1: Arrastrar el número al resultado (Drag & Drop) */}
          <div
            id="start-drag-drop-card"
            onClick={() => {
              playSound('click');
              onStartMode('drag_drop');
            }}
            className="cursor-pointer group bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                  <Hand className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <span className="bg-yellow-300 text-yellow-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ¡Nuevo Modo Interactivo!
                  </span>
                  <h4 className="text-xl font-black mt-1">Arrastra al Resultado</h4>
                  <p className="text-xs text-purple-100 mt-1 max-w-xs leading-relaxed">
                    Usa tu dedo o ratón para tomar el número correcto y soltarlo directamente en la caja mágica.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-purple-700 transition">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Modo 2: Parejas Mágicas (Memory Match de operaciones) */}
          <div
            id="start-match-pairs-card"
            onClick={() => {
              playSound('click');
              onStartMode('match_pairs');
            }}
            className="cursor-pointer group bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                  <Puzzle className="w-8 h-8 text-yellow-200" />
                </div>
                <div>
                  <span className="bg-yellow-200 text-amber-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ¡Memoria y Lógica!
                  </span>
                  <h4 className="text-xl font-black mt-1">Parejas Mágicas</h4>
                  <p className="text-xs text-orange-100 mt-1 max-w-xs leading-relaxed">
                    Empareja cada operación matemática con su ficha de resultado correspondiente.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-amber-700 transition">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones de Estudio Específico Tradicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Multiplicaciones */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-purple-100 flex flex-col justify-between hover:border-purple-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-black">
                ✖️
              </div>
              <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg">
                1 al 12
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Tablas de Multiplicar</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Escoge una tabla para dominarla o practica todas combinadas.
            </p>

            {/* Selector de tablas del 1 al 12 */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setSelectedTable(num);
                    playSound('click');
                  }}
                  className={`py-1.5 rounded-xl font-black text-xs transition ${
                    selectedTable === num
                      ? 'bg-purple-600 text-white shadow-sm scale-105'
                      : 'bg-slate-100 hover:bg-purple-100 text-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            id="start-multiplication-btn"
            onClick={() => {
              playSound('click');
              onStartMode('multiplication', selectedTable);
            }}
            className="w-full py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Jugar Tabla del {selectedTable}
          </button>
        </div>

        {/* 2. Sumas Progresivas */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-pink-100 flex flex-col justify-between hover:border-pink-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-2xl font-black">
                ➕
              </div>
              <span className="text-xs font-bold bg-pink-50 text-pink-700 px-2.5 py-1 rounded-lg">
                1 a 3 dígitos
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Sumas Divertidas</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              ¡Desde números pequeños hasta sumas gigantes con llevadas!
            </p>
            <div className="bg-pink-50/60 rounded-2xl p-3 text-xs text-pink-900 font-medium space-y-1 mb-4">
              <p>🎯 Nivel 1: Sumas rápidas (1 a 2 dígitos)</p>
              <p>🎯 Nivel 2: Sumas con llevada a la decena</p>
              <p>🎯 Nivel 3: Desafío de 3 dígitos (cientos)</p>
            </div>
          </div>

          <button
            id="start-addition-btn"
            onClick={() => {
              playSound('click');
              onStartMode('addition');
            }}
            className="w-full py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Practicar Sumas
          </button>
        </div>

        {/* 3. Restas con Reserva */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-amber-100 flex flex-col justify-between hover:border-amber-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-black">
                ➖
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                Con reserva
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Restas y Préstamos</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Aprende a restar pidiendo prestado a la decena vecina sin enredarte.
            </p>
            <div className="bg-amber-50/60 rounded-2xl p-3 text-xs text-amber-900 font-medium space-y-1 mb-4">
              <p>💡 Tip del búho sabio:</p>
              <p>Si el número de arriba es menor, ¡pídele 10 a su vecino de la izquierda!</p>
            </div>
          </div>

          <button
            id="start-subtraction-btn"
            onClick={() => {
              playSound('click');
              onStartMode('subtraction');
            }}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Practicar Restas
          </button>
        </div>
      </div>

      {/* Pie de página con acceso al panel de padres y opción de instalación PWA */}
      <footer className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs border-t border-slate-200">
        <div className="flex items-center gap-3">
          <p>Aventura Matemática PWA • Aprendizaje didáctico e interactivo</p>
          {!isInstalled && (
            <button
              id="install-pwa-footer-btn"
              onClick={() => {
                playSound('click');
                promptInstall();
              }}
              className="text-purple-600 hover:text-purple-800 font-extrabold flex items-center gap-1 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar en el móvil / PC</span>
            </button>
          )}
        </div>
        <button
          id="open-parents-dashboard-link"
          onClick={() => {
            playSound('click');
            onOpenParents();
          }}
          className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition flex items-center gap-1.5"
        >
          🔒 Acceso para Padres
        </button>
      </footer>
    </div>
  );
};
