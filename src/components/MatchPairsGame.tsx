import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, RefreshCw, Trophy, Flame } from 'lucide-react';
import type { MatchCard, ExerciseResult } from '../types/math';
import { generateMemoryPairs } from '../utils/mathGenerator';
import { playSound, fireSuccessConfetti } from '../utils/effects';

interface MatchPairsGameProps {
  onFinishSession: (results: ExerciseResult[]) => void;
  onExit: () => void;
}

export const MatchPairsGame: React.FC<MatchPairsGameProps> = ({ onFinishSession, onExit }) => {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [sessionResults, setSessionResults] = useState<ExerciseResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const startTimeRef = React.useRef<number>(Date.now());

  const totalPairs = 6;

  useEffect(() => {
    initNewGame();
  }, []);

  const initNewGame = () => {
    const newCards = generateMemoryPairs(totalPairs);
    setCards(newCards);
    setSelectedCards([]);
    setMatchedPairsCount(0);
    setMovesCount(0);
    setSessionResults([]);
    setIsProcessing(false);
    startTimeRef.current = Date.now();
  };

  const handleCardClick = (card: MatchCard) => {
    if (isProcessing) return;
    if (card.isMatched) return;
    if (selectedCards.length === 1 && selectedCards[0].id === card.id) return;

    playSound('click');
    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMovesCount((m) => m + 1);
      setIsProcessing(true);

      const [cardA, cardB] = newSelected;
      const isMatch = cardA.pairId === cardB.pairId;

      if (isMatch) {
        // Coincidencia acertada
        playSound('correct');
        fireSuccessConfetti();

        // Registrar como ejercicio completado
        const exprCard = cardA.isExpression ? cardA : cardB;
        const resCard = cardA.isExpression ? cardB : cardA;

        const dummyResult: ExerciseResult = {
          exerciseId: cardA.pairId,
          type: 'multiplication',
          prompt: `${exprCard.content} = ${resCard.content}`,
          num1: 0,
          num2: 0,
          userAnswer: parseInt(resCard.content, 10) || 0,
          correctAnswer: parseInt(resCard.content, 10) || 0,
          isCorrect: true,
          timeSpentMs: 4000,
          categoryKey: 'match-pairs',
        };

        const updatedResults = [...sessionResults, dummyResult];
        setSessionResults(updatedResults);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.pairId === cardA.pairId ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
          const newMatched = matchedPairsCount + 1;
          setMatchedPairsCount(newMatched);

          // Si completó todas las 6 parejas
          if (newMatched >= totalPairs) {
            setTimeout(() => {
              onFinishSession(updatedResults);
            }, 1200);
          }
        }, 600);
      } else {
        // Pareja incorrecta
        playSound('wrong');
        setTimeout(() => {
          setSelectedCards([]);
          setIsProcessing(false);
        }, 1100);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 md:py-8 space-y-6 select-none">
      {/* Barra superior de estado */}
      <div className="flex items-center justify-between gap-3 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-md border border-purple-100">
        <button
          id="exit-match-game-btn"
          onClick={() => {
            playSound('click');
            onExit();
          }}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          aria-label="Salir del minijuego"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 px-2 text-center">
          <h2 className="text-base md:text-lg font-black text-purple-900 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" /> Parejas Mágicas
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Encuentra la operación y su resultado correspondiente
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Contador de parejas */}
          <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl font-black text-purple-900 text-sm">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span>{matchedPairsCount}/{totalPairs}</span>
          </div>

          <button
            id="reset-match-game-btn"
            onClick={initNewGame}
            className="p-2 rounded-xl text-purple-600 hover:bg-purple-50 transition border border-purple-200"
            title="Reiniciar tablero"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tablero de cartas didácticas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card) => {
          const isSelected = selectedCards.some((c) => c.id === card.id);
          const isMatched = card.isMatched;

          let cardStyle = 'bg-white text-purple-900 border-2 border-purple-200 shadow-md hover:border-purple-400 hover:scale-105 active:scale-95';

          if (isMatched) {
            cardStyle = 'bg-emerald-500 text-white border-2 border-emerald-600 scale-95 opacity-85 shadow-sm';
          } else if (isSelected) {
            cardStyle = 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-2 border-purple-700 scale-105 shadow-xl ring-4 ring-purple-200';
          }

          return (
            <button
              key={card.id}
              disabled={isMatched || isProcessing}
              onClick={() => handleCardClick(card)}
              className={`h-24 md:h-28 rounded-3xl font-black text-xl md:text-2xl transition-all duration-300 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden ${cardStyle}`}
            >
              <span className="leading-tight">{card.content}</span>
              {card.isExpression && !isMatched && (
                <span className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-purple-200' : 'text-purple-400'}`}>
                  Operación
                </span>
              )}
              {!card.isExpression && !isMatched && (
                <span className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-purple-200' : 'text-indigo-400'}`}>
                  Resultado
                </span>
              )}
              {isMatched && (
                <span className="text-[10px] uppercase font-black tracking-widest mt-1 text-emerald-100">
                  ¡Emparejado! ⭐
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tarjeta inferior explicativa */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center">
        <p className="text-xs md:text-sm font-bold text-amber-900">
          💡 Truco de cálculo mental: Si ves una operación como <span className="underline">7 × 8</span>, busca la ficha con el número <span className="underline">56</span> para ganar estrellas.
        </p>
      </div>
    </div>
  );
};
