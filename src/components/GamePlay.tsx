import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Flame, CheckCircle2, XCircle, Hand, Sparkles } from 'lucide-react';
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
  const [sessionStreak, setSessionStreak] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Temporizador
  const exerciseStartTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(15);

  const currentExercise = exercises[currentIndex];
  const isDragMode = currentExercise?.interactionStyle === 'drag_and_drop';

  useEffect(() => {
    exerciseStartTimeRef.current = Date.now();
    setTimeLeft(15);
    setFeedbackState('idle');
    setSelectedOption(null);
    setIsDraggingOver(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!timerEnabled || feedbackState !== 'idle') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, feedbackState, timerEnabled]);

  const handleTimeOut = () => {
    handleSelectAnswer(-9999);
  };

  const handleSelectAnswer = (userAnswer: number) => {
    if (feedbackState !== 'idle') return;

    setSelectedOption(userAnswer);
    const timeSpentMs = Date.now() - exerciseStartTimeRef.current;
    const isCorrect = userAnswer === currentExercise.correctAnswer;

    if (isCorrect) {
      setFeedbackState('correct');
      setSessionStreak((s) => s + 1);
      playSound('correct');
      fireSuccessConfetti();
    } else {
      setFeedbackState('wrong');
      setSessionStreak(0);
      playSound('wrong');
    }

    const newResult: ExerciseResult = {
      exerciseId: currentExercise.id,
      type: currentExercise.type,
      prompt: `${currentExercise.num1} ${currentExercise.operator} ${currentExercise.num2}`,
      num1: currentExercise.num1,
      num2: currentExercise.num2,
      userAnswer,
      correctAnswer: currentExercise.correctAnswer,
      isCorrect,
      timeSpentMs,
      categoryKey: currentExercise.categoryKey,
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    setTimeout(() => {
      if (currentIndex + 1 < exercises.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        onFinishSession(updatedResults);
      }
    }, 1400);
  };

  // Manejo de eventos de Drag & Drop (HTML5 Drag & Drop nativo)
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
    <div className="w-full max-w-2xl mx-auto px-4 py-4 md:py-8 space-y-6 select-none">
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

        {/* Indicador de Racha */}
        <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
          <Flame className={`w-5 h-5 ${sessionStreak > 0 ? 'text-orange-500 fill-orange-400 animate-bounce' : 'text-slate-300'}`} />
          <span className="text-sm font-black text-orange-950">{sessionStreak}</span>
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

      {/* Zona didáctica de la Operación Matemática */}
      <div className={`relative bg-white rounded-3xl p-6 md:p-10 shadow-2xl border-4 text-center transition-all duration-300 ${
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
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {currentExercise.type === 'multiplication' && 'Multiplicación Mágica'}
                {currentExercise.type === 'addition' && 'Suma Veloz'}
                {currentExercise.type === 'subtraction' && (currentExercise.hasRegrouping ? 'Resta con Reserva 💡' : 'Resta Rápida')}
              </>
            )}
          </span>
        </div>

        {/* Enunciado matemático con la diana de soltado (Dropzone) */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-5xl md:text-7xl font-black text-slate-800 tracking-wider py-4">
          <span className="text-purple-600">{currentExercise.num1}</span>
          <span className="text-pink-500">{currentExercise.operator}</span>
          <span className="text-indigo-600">{currentExercise.num2}</span>
          <span className="text-slate-400">=</span>

          {/* Caja receptora (Dropzone) */}
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

        {/* Mensaje de feedback tras responder */}
        <div className="h-10 mt-2 flex items-center justify-center">
          {feedbackState === 'correct' && (
            <div className="flex items-center gap-2 text-emerald-600 font-black text-lg md:text-xl animate-bounce">
              <CheckCircle2 className="w-7 h-7" />
              ¡Increíble acierto! ¡Ese es el número correcto! ⭐
            </div>
          )}
          {feedbackState === 'wrong' && (
            <div className="flex items-center gap-2 text-rose-500 font-bold text-base md:text-lg">
              <XCircle className="w-6 h-6" />
              <span>
                ¡Casi! La respuesta correcta era{' '}
                <strong className="underline text-rose-700">{currentExercise.correctAnswer}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Opciones de números arrastrables y táctiles */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-bold text-slate-500">
            {isDragMode ? 'Toma un número con el dedo/ratón y arrástralo a la caja, o pulsa sobre él:' : 'Selecciona la respuesta correcta:'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currentExercise.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isAnswerCorrect = option === currentExercise.correctAnswer;

            let btnStyle = 'bg-white text-slate-800 hover:bg-purple-50 border-2 border-purple-200 shadow-md hover:border-purple-400 hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing';

            if (feedbackState !== 'idle') {
              if (isAnswerCorrect) {
                btnStyle = 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-xl scale-105';
              } else if (isSelected && !isAnswerCorrect) {
                btnStyle = 'bg-rose-400 text-white border-2 border-rose-500 opacity-80';
              } else {
                btnStyle = 'bg-slate-100 text-slate-400 border-2 border-slate-200 opacity-50';
              }
            }

            return (
              <button
                key={`${option}-${idx}`}
                id={`math-option-${idx}`}
                draggable={feedbackState === 'idle'}
                onDragStart={(e) => handleDragStart(e, option)}
                disabled={feedbackState !== 'idle'}
                onClick={() => handleSelectAnswer(option)}
                className={`h-20 md:h-24 rounded-3xl font-black text-3xl md:text-4xl transition-all duration-200 flex flex-col items-center justify-center relative group ${btnStyle}`}
              >
                <span>{option}</span>
                {isDragMode && feedbackState === 'idle' && (
                  <span className="text-[10px] font-bold text-purple-400 group-hover:text-purple-600 flex items-center gap-0.5">
                    <Hand className="w-2.5 h-2.5" /> Arrastrar
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
