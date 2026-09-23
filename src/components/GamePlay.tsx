import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clock,
  ArrowLeft,
  Hand,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  Compass,
  Lock,
  Unlock
} from 'lucide-react';
import type { Exercise, ExerciseResult } from '../types/math';
import { playSound, fireSuccessConfetti } from '../utils/effects';

interface GamePlayProps {
  exercises: Exercise[];
  modeName: string;
  timerEnabled: boolean;
  onFinishSession: (results: ExerciseResult[]) => void;
  onExit: () => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  exercises,
  modeName,
  timerEnabled,
  onFinishSession,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Cantidad de cofres abiertos (para mantener el suspenso sin mostrar las letras antes de tiempo)
  const [unlockedChests, setUnlockedChests] = useState<number[]>([]);

  // Temporizador opcional
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseStartTimeRef = useRef<number>(Date.now());

  const currentExercise = exercises[currentIndex];
  const isDragMode = currentExercise?.interactionStyle === 'drag_and_drop';

  // REGLA CLAVE: Las multiplicaciones en todos los módulos son HORIZONTALES.
  // Las sumas y restas son VERTICALES.
  const isVertical = currentExercise?.type === 'addition' || currentExercise?.type === 'subtraction';
  const islandData = currentExercise?.contextQuestion?.islandData;

  useEffect(() => {
    exerciseStartTimeRef.current = Date.now();
    setSelectedOption(null);
    setFeedbackState('idle');
    setShowHint(false);

    if (timerEnabled) {
      setTimeLeft(15);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, timerEnabled]);

  const handleTimeOut = () => {
    if (feedbackState !== 'idle') return;
    handleSelectAnswer(-9999);
  };

  const handleSelectAnswer = (chosenNumber: number) => {
    if (feedbackState !== 'idle') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentMs = Date.now() - exerciseStartTimeRef.current;
    const isCorrect = chosenNumber === currentExercise.correctAnswer;

    setSelectedOption(chosenNumber);
    setFeedbackState(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playSound('correct');
      fireSuccessConfetti();
      if (islandData) {
        setUnlockedChests((prev) => [...prev, islandData.letterIndex]);
      }
    } else {
      playSound('wrong');
    }

    // Registrar resultado pedagógico
    const resultItem: ExerciseResult = {
      exerciseId: currentExercise.id,
      type: currentExercise.type,
      prompt: `${currentExercise.num1} ${currentExercise.operator} ${currentExercise.num2}`,
      num1: currentExercise.num1,
      num2: currentExercise.num2,
      userAnswer: chosenNumber,
      correctAnswer: currentExercise.correctAnswer,
      isCorrect,
      timeSpentMs,
      categoryKey: currentExercise.categoryKey,
    };

    const updatedResults = [...results, resultItem];
    setResults(updatedResults);

    // Pausa didáctica de 1.4s para que Sofía observe la retroalimentación
    setTimeout(() => {
      if (currentIndex + 1 < exercises.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        onFinishSession(updatedResults);
      }
    }, 1400);
  };

  // Manejo de eventos de Drag & Drop
  const handleDragStart = (e: React.DragEvent, option: number) => {
    e.dataTransfer.setData('text/plain', option.toString());
    playSound('click');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      const num = parseInt(data, 10);
      if (!isNaN(num)) {
        handleSelectAnswer(num);
      }
    }
  };

  if (!currentExercise) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 md:py-8 space-y-5 select-none">
      {/* Barra de progreso superior y controles */}
      <div className="flex items-center justify-between gap-3 bg-white/90 backdrop-blur rounded-2xl p-4 shadow-md border border-slate-100">
        <button
          id="exit-gameplay-btn"
          onClick={() => {
            playSound('click');
            onExit();
          }}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          aria-label="Salir de la ronda"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 px-2">
          <div className="flex justify-between text-xs font-black text-slate-500 mb-1.5">
            <span>{modeName}</span>
            <span>Reto {currentIndex + 1} de {exercises.length}</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Temporizador */}
        {timerEnabled && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-sm border ${
            timeLeft <= 5 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* PANEL DE LA ISLA DEL TESORO: MÁXIMO SUSPENSO (SIN PISTAS DE LETRAS) */}
      {islandData && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '10s' }} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-200">
                  Enigma de la Isla Misteriosa 🗝️
                </span>
                <h3 className="text-base md:text-lg font-black leading-tight text-yellow-300">
                  Palabra Secreta en Suspenso
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/30 text-yellow-200 border border-yellow-400/30">
              {unlockedChests.length} / {islandData.totalLetters} cofres abiertos
            </span>
          </div>

          <p className="text-xs text-teal-100/90 leading-relaxed">
            Cada multiplicación que resuelvas abrirá un cofre secreto con candado. ¡La palabra misteriosa se revelará al final!
          </p>

          {/* Cofres secretos con candado (SIN revelar letras para mantener el misterio) */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-white/10 flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            {islandData.targetWord.split('').map((_, idx) => {
              const isUnlocked = unlockedChests.includes(idx);
              const isCurrent = islandData.letterIndex === idx;

              return (
                <div
                  key={idx}
                  className={`w-11 h-14 md:w-13 md:h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-amber-950 border-yellow-200 shadow-lg scale-105 font-black'
                      : isCurrent
                      ? 'bg-teal-600/60 border-yellow-300 border-dashed animate-pulse text-yellow-300'
                      : 'bg-white/5 border-white/15 text-white/40'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75">#{idx + 1}</span>
                  <div className="mt-1">
                    {isUnlocked ? (
                      <Unlock className="w-5 h-5 text-amber-950" />
                    ) : (
                      <Lock className={`w-4 h-4 ${isCurrent ? 'text-yellow-300' : 'text-slate-400'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TARJETA DIDÁCTICA DE PROBLEMA MATEMÁTICO */}
      {currentExercise.contextQuestion && !islandData && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border-2 border-amber-200 shadow-md text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Problema de la Vida Diaria</span>
          </div>
          <p className="text-slate-800 font-semibold text-sm md:text-base leading-relaxed">
            {currentExercise.contextQuestion.story}
          </p>
          <div className="bg-white/80 rounded-2xl p-3 border border-amber-200 text-purple-900 font-black text-sm md:text-base flex items-center justify-between">
            <span>{currentExercise.contextQuestion.subQuestion}</span>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg flex items-center gap-1 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Pista
            </button>
          </div>
          {showHint && currentExercise.contextQuestion.visualHint && (
            <div className="text-xs text-amber-800 bg-amber-100/80 p-2.5 rounded-xl font-medium animate-in fade-in">
              💡 <strong>Pista de Sofía:</strong> {currentExercise.contextQuestion.visualHint}
            </div>
          )}
        </div>
      )}

      {/* ZONA PRINCIPAL DE LA OPERACIÓN */}
      <div className={`relative bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 text-center transition-all duration-300 ${
        feedbackState === 'correct'
          ? 'border-emerald-400 bg-emerald-50/40 scale-[1.02]'
          : feedbackState === 'wrong'
          ? 'border-rose-300 bg-rose-50/30'
          : isDraggingOver
          ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]'
          : 'border-white'
      }`}>
        {/* Etiqueta del modo didáctico */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1.5">
            {isDragMode ? (
              <>
                <Hand className="w-3.5 h-3.5 text-purple-600" /> ¡Arrastra el número o tócalo!
              </>
            ) : islandData ? (
              <>
                <Award className="w-3.5 h-3.5 text-purple-600" /> Cofre Misterioso #{islandData.letterIndex + 1}
              </>
            ) : currentExercise.contextQuestion ? (
              <>
                <Award className="w-3.5 h-3.5 text-purple-600" /> Problema Matemático
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {currentExercise.type === 'multiplication' && (currentExercise.hasRegrouping ? 'Multiplicación con Reagrupación' : 'Multiplicación')}
                {currentExercise.type === 'addition' && 'Suma Vertical'}
                {currentExercise.type === 'subtraction' && (currentExercise.hasRegrouping ? 'Resta Vertical con Reserva 💡' : 'Resta Vertical')}
              </>
            )}
          </span>

          {isVertical && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500" /> Formato Vertical
            </span>
          )}
        </div>

        {/* FORMATO 1: PRESENTACIÓN VERTICAL (EXCLUSIVO PARA SUMAS Y RESTAS) */}
        {isVertical ? (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="inline-block text-right font-black text-4xl sm:text-5xl md:text-6xl text-slate-800 tracking-wider font-mono">
              <div className="flex justify-end gap-5 text-xs text-slate-400 tracking-widest font-sans font-bold pr-2 pb-1">
                {Math.max(currentExercise.num1, currentExercise.num2) >= 100 && <span>C</span>}
                {Math.max(currentExercise.num1, currentExercise.num2) >= 10 && <span>D</span>}
                <span>U</span>
              </div>

              {/* Número superior */}
              <div className="px-4 py-1 text-purple-700">
                {currentExercise.num1}
              </div>

              {/* Número inferior precedido del operador */}
              <div className="flex items-center justify-end px-4 py-1 border-b-4 border-slate-800">
                <span className="text-pink-500 mr-4 font-black font-sans text-3xl sm:text-4xl">
                  {currentExercise.operator}
                </span>
                <span className="text-indigo-600">
                  {currentExercise.num2}
                </span>
              </div>

              {/* Caja de resultado vertical */}
              <div className="pt-3 flex justify-center">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`min-w-[130px] md:min-w-[170px] h-18 md:h-22 px-4 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center font-black ${
                    feedbackState === 'correct'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                      : feedbackState === 'wrong'
                      ? 'bg-rose-500 text-white border-rose-600'
                      : isDraggingOver
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-500 border-dashed scale-105 shadow-lg'
                      : 'bg-purple-50 text-purple-600 border-purple-300 border-dashed'
                  }`}
                >
                  {feedbackState === 'idle' ? (
                    selectedOption === null ? (
                      <div className="text-center">
                        <span className="text-2xl md:text-3xl font-black text-purple-400">?</span>
                        {isDragMode && (
                          <span className="block text-[9px] font-bold text-purple-600 uppercase tracking-tight">
                            Soltar aquí
                          </span>
                        )}
                      </div>
                    ) : selectedOption === -9999 ? (
                      '⏳'
                    ) : (
                      selectedOption
                    )
                  ) : selectedOption === -9999 ? (
                    '⏳'
                  ) : (
                    selectedOption
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FORMATO 2: PRESENTACIÓN HORIZONTAL (PARA TODAS LAS MULTIPLICACIONES EN TODOS LOS MÓDULOS) */
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-wider py-4">
            <span className="text-purple-600">{currentExercise.num1}</span>
            <span className="text-pink-500 font-bold">{currentExercise.operator}</span>
            <span className="text-indigo-600">{currentExercise.num2}</span>
            <span className="text-slate-400">=</span>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl border-4 transition-all duration-200 flex flex-col items-center justify-center font-black ${
                feedbackState === 'correct'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                  : feedbackState === 'wrong'
                  ? 'bg-rose-500 text-white border-rose-600'
                  : isDraggingOver
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-500 border-dashed scale-110 shadow-lg'
                  : 'bg-purple-50 text-purple-600 border-purple-300 border-dashed'
              }`}
            >
              {feedbackState === 'idle' ? (
                selectedOption === null ? (
                  <div className="text-center">
                    <span className="text-3xl md:text-5xl font-black text-purple-400">?</span>
                    {isDragMode && (
                      <span className="block text-[10px] font-bold text-purple-600 uppercase tracking-tighter">
                        Soltar aquí
                      </span>
                    )}
                  </div>
                ) : selectedOption === -9999 ? (
                  '⏳'
                ) : (
                  selectedOption
                )
              ) : selectedOption === -9999 ? (
                '⏳'
              ) : (
                selectedOption
              )}
            </div>
          </div>
        )}

        {/* Guía didáctica opcional de pasos */}
        {currentExercise.regroupingSteps && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-left bg-purple-50/70 p-3 rounded-2xl text-xs text-purple-950 space-y-1">
            <p className="font-bold text-purple-800">📝 Pasos para calcular:</p>
            <p className="font-medium">• {currentExercise.regroupingSteps.step1Prompt}</p>
            <p className="font-medium">• {currentExercise.regroupingSteps.step2Prompt}</p>
          </div>
        )}

        {/* Retroalimentación visual interactiva (Sin pistas de letras en la isla) */}
        <div className="h-9 mt-3 flex items-center justify-center">
          {feedbackState === 'correct' && (
            <div className="text-emerald-700 font-black text-base md:text-lg flex items-center gap-2 animate-bounce">
              <span>
                {islandData
                  ? `🗝️ ¡Cofre #${islandData.letterIndex + 1} abierto con éxito!`
                  : '🌟 ¡Excelente, Sofía! ¡Respuesta correcta!'}
              </span>
            </div>
          )}
          {feedbackState === 'wrong' && (
            <div className="text-rose-600 font-black text-sm md:text-base flex items-center gap-1.5 animate-shake">
              <span>💡 ¡Casi! La respuesta correcta era {currentExercise.correctAnswer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Opciones de Respuesta Táctil / Fichas para Arrastrar */}
      <div className="space-y-2 text-center">
        {isDragMode && (
          <p className="text-xs text-purple-700 font-bold">
            Arrastra con tu dedo la ficha o toca para seleccionar:
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {currentExercise.options.map((option, idx) => {
            const isChosen = selectedOption === option;
            const isRightOne = option === currentExercise.correctAnswer;
            let btnClass = 'bg-white hover:bg-purple-50 text-slate-800 border-2 border-slate-200 shadow-md active:scale-95';

            if (feedbackState !== 'idle') {
              if (isRightOne) {
                btnClass = 'bg-emerald-500 text-white border-emerald-600 shadow-xl scale-105 ring-4 ring-emerald-200';
              } else if (isChosen && !isRightOne) {
                btnClass = 'bg-rose-400 text-white border-rose-500 opacity-60';
              } else {
                btnClass = 'bg-slate-100 text-slate-400 border-slate-200 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                id={`game-option-btn-${idx}`}
                disabled={feedbackState !== 'idle'}
                draggable={feedbackState === 'idle'}
                onDragStart={(e) => handleDragStart(e, option)}
                onClick={() => {
                  playSound('click');
                  handleSelectAnswer(option);
                }}
                className={`py-4 md:py-6 px-3 rounded-2xl md:rounded-3xl font-black text-2xl md:text-3xl transition duration-150 cursor-pointer select-none flex flex-col items-center justify-center gap-1 ${btnClass}`}
              >
                <span>{option}</span>
                {currentExercise.contextQuestion?.unitLabel && (
                  <span className="text-[10px] font-bold opacity-80 truncate max-w-full">
                    {currentExercise.contextQuestion.unitLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
