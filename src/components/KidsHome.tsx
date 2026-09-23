import React, { useState, useEffect } from 'react';
import {
  Play,
  Flame,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  Timer,
  ChevronRight,
  Hand,
  Puzzle,
  Download,
  Smartphone,
  BookOpen,
  Layers,
  MapPin,
  HelpCircle
} from 'lucide-react';
import type { UserStats } from '../types/math';
import { playSound } from '../utils/effects';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface KidsHomeProps {
  userStats: UserStats;
  onStartMode: (
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
      | 'island_treasure',
    table?: number
  ) => void;
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
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const { isInstallable, hasNativePrompt, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();

  const handleInstallClick = () => {
    playSound('click');
    if (hasNativePrompt && !isInIframe) {
      promptInstall();
    } else {
      setShowInstallModal(true);
    }
  };

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
              <span>Nivel {userStats.level}</span> • <span>Aventurera Matemática</span>
            </p>
          </div>
        </div>

        {/* Marcadores de Gamificación */}
        <div className="flex items-center gap-3">
          {/* Racha actual */}
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl text-orange-600 font-black text-sm shadow-xs">
            <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{userStats.currentStreak} racha</span>
          </div>

          {/* Estrellas doradas */}
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-2xl text-yellow-700 font-black text-sm shadow-xs">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
            <span>{userStats.totalStars}</span>
          </div>

          {/* Botón PWA para Instalar en Teléfono / Tablet */}
          {!isInstalled && (
            <button
              id="install-pwa-header-btn"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs shadow-md hover:shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Instalar en teléfono o tablet"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden">Instalar</span>
            </button>
          )}

          {/* Controles de sonido y temporizador */}
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => {
                playSound('click');
                onToggleSound();
              }}
              className={`p-2 rounded-xl transition ${soundEnabled ? 'bg-white shadow-xs text-purple-600' : 'text-slate-400'}`}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar efectos'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                playSound('click');
                onToggleTimer();
              }}
              className={`p-2 rounded-xl transition ${timerEnabled ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400'}`}
              title={timerEnabled ? 'Desactivar reloj (Sin prisa)' : 'Activar reloj (15s por reto)'}
            >
              <Timer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* RECOMENDACIÓN DE GEMINI O BOTÓN DESTACADO ADAPTATIVO */}
      {userStats.aiRecommendations && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-yellow-200">
                <Sparkles className="w-3.5 h-3.5" /> Consejo Mágico para Sofía
              </div>
              <p className="text-base md:text-lg font-black leading-snug">
                {userStats.aiRecommendations.motivationalQuote}
              </p>
              <p className="text-xs md:text-sm text-pink-100 font-medium leading-relaxed">
                {userStats.aiRecommendations.summary}
              </p>
            </div>

            <button
              id="start-ai-recommended-btn"
              onClick={() => {
                playSound('click');
                onStartMode('ai_recommended');
              }}
              className="shrink-0 px-6 py-3.5 rounded-2xl bg-white text-purple-700 hover:bg-yellow-300 hover:text-yellow-950 font-black text-sm shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jugar Refuerzo Adaptativo</span>
            </button>
          </div>
          <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* BOTÓN GIGANTE: GRAN AVENTURA MIXTA */}
      <div
        id="start-adventure-card"
        onClick={() => {
          playSound('click');
          onStartMode('adventure');
        }}
        className="cursor-pointer group bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-3xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
              🚀
            </div>
            <div>
              <span className="bg-yellow-300 text-teal-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado para hoy
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-1">
                Gran Aventura de Matemáticas
              </h2>
              <p className="text-sm text-emerald-50 max-w-md mt-1 font-medium">
                Una mezcla mágica de multiplicaciones, sumas y restas verticales, y problemas del huerto. ¡Gana 10 estrellas doradas!
              </p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg group-hover:bg-yellow-300 group-hover:text-yellow-900 transition shrink-0">
            <ChevronRight className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* NUEVOS MÓDULOS DE APRENDIZAJE Y EJERCICIOS DEL CUADERNO DE SOFÍA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-800">Módulos del Cuaderno de Sofía</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">Contenido pedagógico 3º y 4º</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Módulo A: Problemas Matemáticos Contextuales */}
          <div
            id="start-word-problems-card"
            onClick={() => {
              playSound('click');
              onStartMode('word_problems');
            }}
            className="cursor-pointer group bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🍎
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                  Vida Diaria
                </span>
              </div>
              <h4 className="text-lg font-black leading-tight">Problemas Matemáticos</h4>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                Las ciruelas de tía Flor, cajas de leche, alcancías y donaciones con pistas y comprensión lectora.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-black text-amber-100 group-hover:text-white">
              <span>Resolver problemas</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Módulo B: Multiplicación con Reagrupación (Práctica 2) */}
          <div
            id="start-regrouping-card"
            onClick={() => {
              playSound('click');
              onStartMode('regrouping_mult');
            }}
            className="cursor-pointer group bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🧮
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                  Vertical
                </span>
              </div>
              <h4 className="text-lg font-black leading-tight">Multiplica Reagrupando</h4>
              <p className="text-xs text-purple-100 mt-1 leading-relaxed">
                Multiplicaciones de 2 y 3 dígitos (como 18 × 7 o 486 × 2) con formato vertical y pasos de reserva.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-black text-purple-100 group-hover:text-white">
              <span>Practicar pasos</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Módulo C: La Isla del Tesoro (Práctica 3: Chiloé) */}
          <div
            id="start-island-treasure-card"
            onClick={() => {
              playSound('click');
              onStartMode('island_treasure');
            }}
            className="cursor-pointer group bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-3xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🏝️
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-300 text-teal-950">
                  Desafío
                </span>
              </div>
              <h4 className="text-lg font-black leading-tight">Isla del Tesoro (Chiloé)</h4>
              <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                Descifra los cofres secretos resolviendo operaciones para descifrar la palabra mágica C-H-I-L-O-E.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-black text-teal-100 group-hover:text-white">
              <span>Descifrar enigma</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* MODALIDADES DIDÁCTICAS E INTERACTIVAS (Arrastra y Parejas) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-black text-slate-800">Juegos Interactivos y Dinámicas</h3>
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
                    ¡Táctil y Divertido!
                  </span>
                  <h4 className="text-xl font-black mt-1">Arrastra al Resultado</h4>
                  <p className="text-xs text-purple-100 mt-1 max-w-xs leading-relaxed">
                    Usa tu dedo o ratón para tomar el número y soltarlo directamente en la casilla vertical.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-purple-700 transition shrink-0">
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
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-amber-700 transition shrink-0">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIONES DE ENTRENAMIENTO VERTICAL ESPECÍFICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Multiplicaciones */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-purple-100 flex flex-col justify-between hover:border-purple-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">✖️</span>
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                Tablas 1-12
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800">Tablas de Multiplicar</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Elige tu tabla favorita o la que quieras dominar mejor.
            </p>

            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <button
                  key={num}
                  id={`select-table-${num}-btn`}
                  onClick={() => {
                    playSound('click');
                    setSelectedTable(num);
                  }}
                  className={`py-2 rounded-xl font-black text-xs transition ${
                    selectedTable === num
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            id="start-multiplication-mode-btn"
            onClick={() => {
              playSound('click');
              onStartMode('multiplication', selectedTable);
            }}
            className="mt-5 w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md transition"
          >
            Practicar Tabla del {selectedTable}
          </button>
        </div>

        {/* 2. Sumas Verticales */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-pink-100 flex flex-col justify-between hover:border-pink-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">➕</span>
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-pink-50 text-pink-700">
                En Columnas
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800">Sumas Verticales</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Alineadas en columnas con unidades, decenas y centenas para sumar paso a paso fácilmente.
            </p>
          </div>

          <button
            id="start-addition-mode-btn"
            onClick={() => {
              playSound('click');
              onStartMode('addition');
            }}
            className="mt-5 w-full py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm shadow-md transition"
          >
            Practicar Sumas Verticales
          </button>
        </div>

        {/* 3. Restas con Reserva Verticales */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-amber-100 flex flex-col justify-between hover:border-amber-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">➖</span>
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800">
                Con Reserva
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800">Restas Verticales</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Formato vertical con el truco del vecino para pedir prestado y no confundirse.
            </p>
          </div>

          <button
            id="start-subtraction-mode-btn"
            onClick={() => {
              playSound('click');
              onStartMode('subtraction');
            }}
            className="mt-5 w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition"
          >
            Practicar Restas Verticales
          </button>
        </div>
      </div>

      {/* Pie de página con acceso para Padres y Botón PWA */}
      <footer className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 text-xs text-slate-400">
        <p className="font-medium">
          Aventura Matemática • Diseñado con cariño para Sofía ✨
        </p>

        <div className="flex items-center gap-3">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="font-bold text-purple-600 hover:text-purple-800 transition flex items-center gap-1.5 cursor-pointer bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar en Teléfono / Tablet</span>
            </button>
          )}

          <button
            id="open-parents-dashboard-btn"
            onClick={() => {
              playSound('click');
              onOpenParents();
            }}
            className="font-bold text-slate-600 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            <span>🔒 Zona de Padres</span>
          </button>
        </div>
      </footer>

      {/* Modal PWA para instalación guiada */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onTriggerInstall={promptInstall}
        hasNativePrompt={hasNativePrompt}
        isIOS={isIOS}
        isInIframe={isInIframe}
      />
    </div>
  );
};
