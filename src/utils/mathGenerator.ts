import type { Exercise, MatchCard } from '../types/math';

// Barajar elementos de un array
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generar opciones de respuesta realistas pero incorrectas
function generateDistractors(correctAnswer: number, min: number = 0, maxOffset: number = 10): number[] {
  const options = new Set<number>();
  options.add(correctAnswer);

  const deltas = [-10, 10, -1, 1, -2, 2, -5, 5, -3, 3];
  shuffle(deltas);

  for (const delta of deltas) {
    const candidate = correctAnswer + delta;
    if (candidate >= min && candidate !== correctAnswer) {
      options.add(candidate);
    }
    if (options.size === 4) break;
  }

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * maxOffset * 2) - maxOffset;
    const candidate = Math.max(min, correctAnswer + offset);
    if (candidate !== correctAnswer) {
      options.add(candidate);
    }
  }

  return shuffle(Array.from(options));
}

// 1. Generar ejercicio de tabla de multiplicar
export function generateMultiplicationExercise(tableNumber?: number): Exercise {
  const num1 = tableNumber && tableNumber >= 1 && tableNumber <= 12
    ? tableNumber
    : Math.floor(Math.random() * 12) + 1;
  const num2 = Math.floor(Math.random() * 12) + 1;
  const correctAnswer = num1 * num2;

  const distractors = new Set<number>([correctAnswer]);
  distractors.add(num1 * (num2 + 1));
  distractors.add(Math.max(0, num1 * (num2 - 1)));
  distractors.add((num1 + 1) * num2);
  distractors.add(Math.max(0, (num1 - 1) * num2));
  distractors.add(correctAnswer + (Math.random() > 0.5 ? 2 : -2));

  const finalOptions = shuffle(Array.from(distractors).filter(n => n >= 0).slice(0, 4));
  while (finalOptions.length < 4) {
    finalOptions.push(correctAnswer + finalOptions.length * 3);
  }

  return {
    id: `mult-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'multiplication',
    num1,
    num2,
    operator: '×',
    correctAnswer,
    options: shuffle(finalOptions),
    categoryKey: `mult-${num1}`
  };
}

// 2. Generar ejercicio de suma (dificultad progresiva 1 a 3 dígitos)
export function generateAdditionExercise(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Exercise {
  let num1 = 0;
  let num2 = 0;
  let hasRegrouping = false;

  if (difficulty === 'easy') {
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 15) + 3;
    hasRegrouping = (num1 % 10) + (num2 % 10) >= 10;
  } else if (difficulty === 'medium') {
    num1 = Math.floor(Math.random() * 70) + 15;
    num2 = Math.floor(Math.random() * 50) + 12;
    hasRegrouping = (num1 % 10) + (num2 % 10) >= 10;
  } else {
    num1 = Math.floor(Math.random() * 600) + 100;
    num2 = Math.floor(Math.random() * 400) + 50;
    hasRegrouping = true;
  }

  const correctAnswer = num1 + num2;
  const options = generateDistractors(correctAnswer, 0, 15);

  return {
    id: `add-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'addition',
    num1,
    num2,
    operator: '+',
    correctAnswer,
    options,
    hasRegrouping,
    categoryKey: hasRegrouping ? 'add-regroup' : 'add-standard'
  };
}

// 3. Generar ejercicio de resta (incluyendo restas con reserva/llevada)
export function generateSubtractionExercise(forceRegrouping: boolean = true): Exercise {
  let num1 = 0;
  let num2 = 0;

  if (forceRegrouping) {
    const tens1 = Math.floor(Math.random() * 6) + 3;
    const units1 = Math.floor(Math.random() * 5);
    num1 = tens1 * 10 + units1;

    const tens2 = Math.floor(Math.random() * (tens1 - 1)) + 1;
    const units2 = Math.floor(Math.random() * 4) + 6;
    num2 = tens2 * 10 + units2;
  } else {
    num1 = Math.floor(Math.random() * 60) + 30;
    num2 = Math.floor(Math.random() * 25) + 5;
    if (num1 < num2) {
      const temp = num1;
      num1 = num2;
      num2 = temp;
    }
  }

  const correctAnswer = num1 - num2;
  const options = generateDistractors(correctAnswer, 0, 12);

  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'subtraction',
    num1,
    num2,
    operator: '−',
    correctAnswer,
    options,
    hasRegrouping: (num1 % 10) < (num2 % 10),
    categoryKey: (num1 % 10) < (num2 % 10) ? 'sub-regroup' : 'sub-standard'
  };
}

// 4. Generar ronda de 10 ejercicios adaptados según modo de juego
export function generateSessionExercises(
  mode: 'adventure' | 'multiplication' | 'addition' | 'subtraction' | 'ai_recommended' | 'drag_drop' | 'match_pairs',
  selectedTable?: number,
  weakCategories: string[] = []
): Exercise[] {
  const exercises: Exercise[] = [];

  for (let i = 0; i < 10; i++) {
    let ex: Exercise;

    if (mode === 'multiplication') {
      ex = generateMultiplicationExercise(selectedTable);
    } else if (mode === 'addition') {
      const diff = i < 3 ? 'easy' : (i < 7 ? 'medium' : 'hard');
      ex = generateAdditionExercise(diff);
    } else if (mode === 'subtraction') {
      const forceRegroup = i % 2 === 0;
      ex = generateSubtractionExercise(forceRegroup);
    } else if (mode === 'drag_drop') {
      // Modo arrastrar y soltar: mezcla de tablas, sumas y restas
      if (i % 3 === 0) ex = generateMultiplicationExercise();
      else if (i % 3 === 1) ex = generateAdditionExercise('easy');
      else ex = generateSubtractionExercise(false);
      ex.interactionStyle = 'drag_and_drop';
    } else if (mode === 'ai_recommended' && weakCategories.length > 0) {
      const targetCategory = weakCategories[i % weakCategories.length];
      if (targetCategory.startsWith('mult-')) {
        const tableNum = parseInt(targetCategory.replace('mult-', ''), 10) || 7;
        ex = generateMultiplicationExercise(tableNum);
      } else if (targetCategory.includes('sub')) {
        ex = generateSubtractionExercise(true);
      } else {
        ex = generateAdditionExercise('medium');
      }
    } else {
      // Modo Aventura variado
      if (i < 4) {
        ex = generateMultiplicationExercise();
      } else if (i < 7) {
        ex = generateAdditionExercise(i === 6 ? 'hard' : 'medium');
      } else {
        ex = generateSubtractionExercise(true);
      }
    }

    exercises.push(ex);
  }

  return shuffle(exercises);
}

// 5. Generar juego de memoria / parejas mágicas (Memory Match)
export function generateMemoryPairs(count: number = 6): MatchCard[] {
  const pairs: { expression: string; result: number }[] = [
    { expression: '6 × 7', result: 42 },
    { expression: '8 × 8', result: 64 },
    { expression: '9 × 4', result: 36 },
    { expression: '7 × 8', result: 56 },
    { expression: '5 × 9', result: 45 },
    { expression: '12 × 3', result: 36 },
    { expression: '25 + 35', result: 60 },
    { expression: '48 + 14', result: 62 },
    { expression: '70 − 25', result: 45 },
    { expression: '52 − 17', result: 35 },
    { expression: '4 × 6', result: 24 },
    { expression: '9 × 9', result: 81 },
  ];

  const selectedPairs = shuffle(pairs).slice(0, count);
  const cards: MatchCard[] = [];

  selectedPairs.forEach((item, index) => {
    const pairId = `pair-${index}`;
    // Tarjeta con la operación
    cards.push({
      id: `${pairId}-expr`,
      pairId,
      content: item.expression,
      isExpression: true,
      isMatched: false,
    });
    // Tarjeta con el resultado
    cards.push({
      id: `${pairId}-res`,
      pairId,
      content: item.result.toString(),
      isExpression: false,
      isMatched: false,
    });
  });

  return shuffle(cards);
}
