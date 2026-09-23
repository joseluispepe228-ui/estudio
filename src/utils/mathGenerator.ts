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

// 1. Generar ejercicio de tabla de multiplicar estándar (SIEMPRE HORIZONTAL)
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
    categoryKey: `mult-${num1}`,
    layout: 'horizontal' // Multiplicación SIEMPRE horizontal
  };
}

// 2. Generar ejercicio de suma VERTICAL (con valor posicional en columnas)
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

  // Asegurar que el número mayor vaya arriba en la suma vertical
  if (num1 < num2) {
    const temp = num1;
    num1 = num2;
    num2 = temp;
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
    categoryKey: hasRegrouping ? 'add-regroup' : 'add-standard',
    layout: 'vertical' // Suma SIEMPRE vertical
  };
}

// 3. Generar ejercicio de resta VERTICAL (con o sin reserva/llevada)
export function generateSubtractionExercise(forceRegrouping: boolean = true): Exercise {
  let num1 = 0;
  let num2 = 0;

  if (forceRegrouping) {
    const tens1 = Math.floor(Math.random() * 6) + 3; // 3 a 8
    const units1 = Math.floor(Math.random() * 5); // 0 a 4
    num1 = tens1 * 10 + units1;

    const tens2 = Math.floor(Math.random() * (tens1 - 1)) + 1; // menor decena
    const units2 = Math.floor(Math.random() * 4) + 6; // 6 a 9 (mayor que units1 -> provoca préstamo)
    num2 = tens2 * 10 + units2;
  } else {
    num1 = Math.floor(Math.random() * 60) + 30;
    num2 = Math.floor(Math.random() * 25) + 5;
    if (num1 < num2) {
      const temp = num1;
      num1 = num2;
      num2 = temp;
    }
    // Asegurar que no necesite reserva si forceRegrouping es false
    if ((num1 % 10) < (num2 % 10)) {
      num1 += 10;
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
    categoryKey: (num1 % 10) < (num2 % 10) ? 'sub-regroup' : 'sub-standard',
    layout: 'vertical' // Resta SIEMPRE vertical
  };
}

// 4. Generador de Problemas Matemáticos Contextualizados (Multiplicaciones en formato horizontal)
export function generateWordProblemExercise(): Exercise {
  const problemTemplates = [
    {
      story: 'La tía Flor recolecta ciruelas frescas de su huerto todos los días.',
      subQuestion: 'Si recolecta 22 ciruelas cada día, ¿cuántas ciruelas recolectó en 4 días?',
      num1: 22,
      num2: 4,
      unitLabel: 'ciruelas',
      iconName: 'fruit' as const,
      visualHint: 'Multiplica 22 ciruelas × 4 días'
    },
    {
      story: 'Rosita guarda monedas en su alcancía todos los meses.',
      subQuestion: 'Si reúne 143 monedas cada mes, ¿cuántas monedas reunirá en 2 meses?',
      num1: 143,
      num2: 2,
      unitLabel: 'monedas',
      iconName: 'coin' as const,
      visualHint: 'Multiplica 143 monedas × 2 meses'
    },
    {
      story: 'El ratón amistoso regaló dulces deliciosos a sus amigos la semana pasada.',
      subQuestion: 'Si regaló 232 dulces la semana pasada y esta semana regaló la misma cantidad, ¿cuántos dulces regaló en total?',
      num1: 232,
      num2: 2,
      unitLabel: 'dulces',
      iconName: 'candy' as const,
      visualHint: '232 dulces × 2 semanas'
    },
    {
      story: 'José organiza su colección de autos de juguete en cajas ordenadas.',
      subQuestion: 'Tiene 7 cajas con autos de juguete. Si en cada caja tiene 5 autos, ¿cuántos autos de juguete tiene José en total?',
      num1: 7,
      num2: 5,
      unitLabel: 'autos de juguete',
      iconName: 'car' as const,
      visualHint: '7 cajas × 5 autos en cada caja'
    },
    {
      story: 'Lina prepara meriendas nutritivas para sus compañeros de clase.',
      subQuestion: 'Tenía 9 bandejas y puso 5 sándwiches de queso en cada una. ¿Cuántos sándwiches preparó en total?',
      num1: 9,
      num2: 5,
      unitLabel: 'sándwiches de queso',
      iconName: 'candy' as const,
      visualHint: '9 bandejas × 5 sándwiches'
    },
    {
      story: 'En el supermercado venden cajas de huevos de campo frescas.',
      subQuestion: 'Mi mamá compró 3 cajas de huevos. Si cada caja contiene 6 huevos, ¿cuántos huevos compró en total?',
      num1: 3,
      num2: 6,
      unitLabel: 'huevos',
      iconName: 'fruit' as const,
      visualHint: '3 cajas × 6 huevos'
    },
    {
      story: 'La familia de Sofía toma mucha leche para crecer fuerte.',
      subQuestion: 'Compraron 3 packs de cajas de leche. Si cada pack trae 10 cajas, ¿cuántas cajas de leche compró?',
      num1: 3,
      num2: 10,
      unitLabel: 'cajas de leche',
      iconName: 'milk' as const,
      visualHint: '3 packs × 10 cajas de leche'
    },
    {
      story: 'Karina compró mostacillas de colores para hacer collares de regalo.',
      subQuestion: 'Ella usa 5 mostacillas para hacer 1 collar. ¿Cuántas mostacillas necesita para hacer 8 collares?',
      num1: 8,
      num2: 5,
      unitLabel: 'mostacillas',
      iconName: 'candy' as const,
      visualHint: '8 collares × 5 mostacillas'
    },
    {
      story: 'Los estudiantes solidarios donaron leche para el comedor escolar.',
      subQuestion: '9 estudiantes donaron leche. Si cada uno donó 5 litros de leche, ¿cuántos litros se recolectaron?',
      num1: 9,
      num2: 5,
      unitLabel: 'litros de leche',
      iconName: 'milk' as const,
      visualHint: '9 estudiantes × 5 litros'
    },
    {
      story: 'Carmen guarda sus cuentos y libros de estudio en cajas.',
      subQuestion: 'Guarda algunos libros en 10 cajas. Si en cada caja guarda 5 libros, ¿cuántos libros guarda en total?',
      num1: 10,
      num2: 5,
      unitLabel: 'libros',
      iconName: 'books' as const,
      visualHint: '10 cajas × 5 libros'
    },
    {
      story: 'Gugo pasea por el bosque primaveral juntando flores silvestres.',
      subQuestion: 'Gugo hace 4 ramos de flores. Si cada ramo tiene 10 flores, ¿cuántas flores reunió Gugo en total?',
      num1: 4,
      num2: 10,
      unitLabel: 'flores',
      iconName: 'flower' as const,
      visualHint: '4 ramos × 10 flores en cada uno'
    },
    {
      story: 'Gugo les pide a 3 alumnos que levanten ambas manos en el aula.',
      subQuestion: 'Hay 5 dedos en cada mano (10 dedos por alumno). Si son 6 manos en total con 5 dedos cada una, ¿cuántos dedos tienen?',
      num1: 6,
      num2: 5,
      unitLabel: 'dedos',
      iconName: 'car' as const,
      visualHint: '6 manos × 5 dedos = ?'
    }
  ];

  const template = problemTemplates[Math.floor(Math.random() * problemTemplates.length)];
  const correctAnswer = template.num1 * template.num2;
  const options = generateDistractors(correctAnswer, 0, 15);

  return {
    id: `word-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'multiplication',
    num1: template.num1,
    num2: template.num2,
    operator: '×',
    correctAnswer,
    options,
    categoryKey: 'word-problem',
    layout: 'horizontal', // Multiplicación en problemas SIEMPRE horizontal
    contextQuestion: {
      story: template.story,
      subQuestion: template.subQuestion,
      unitLabel: template.unitLabel,
      iconName: template.iconName,
      visualHint: template.visualHint
    }
  };
}

// 5. Multiplicación con Reagrupación (SIEMPRE HORIZONTAL según la instrucción)
export function generateRegroupingMultExercise(): Exercise {
  const samplePairs = [
    { n1: 18, n2: 7 },
    { n1: 35, n2: 5 },
    { n1: 486, n2: 2 },
    { n1: 279, n2: 3 },
    { n1: 304, n2: 3 },
    { n1: 156, n2: 4 },
    { n1: 174, n2: 4 },
    { n1: 196, n2: 4 },
    { n1: 238, n2: 4 },
    { n1: 248, n2: 4 },
    { n1: 155, n2: 5 },
    { n1: 199, n2: 5 },
    { n1: 326, n2: 3 },
    { n1: 415, n2: 2 },
    { n1: 184, n2: 5 },
  ];

  const pick = samplePairs[Math.floor(Math.random() * samplePairs.length)];
  const correctAnswer = pick.n1 * pick.n2;
  const options = generateDistractors(correctAnswer, 0, 30);

  const unitsOnly = pick.n1 % 10;
  const tensOnly = Math.floor((pick.n1 % 100) / 10);
  const unitsMult = unitsOnly * pick.n2;
  const regroupTens = Math.floor(unitsMult / 10);
  const remUnits = unitsMult % 10;

  return {
    id: `regroup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'multiplication',
    num1: pick.n1,
    num2: pick.n2,
    operator: '×',
    correctAnswer,
    options,
    hasRegrouping: true,
    categoryKey: 'regrouping-mult',
    layout: 'horizontal', // Multiplicación SIEMPRE horizontal
    regroupingSteps: {
      step1Prompt: `1° Multiplica unidades: ${unitsOnly} × ${pick.n2} = ${unitsMult} unidades (${regroupTens > 0 ? `reagrupa ${regroupTens} decenas y deja ${remUnits}` : `${unitsMult} unidades`})`,
      step2Prompt: `2° Multiplica decenas: ${tensOnly} × ${pick.n2} = ${tensOnly * pick.n2} decenas`,
      step3Prompt: `3° Suma la reagrupación y obtén el resultado final.`
    }
  };
}

// 6. Colección de Aventuras con Palabras Secretas para la Isla del Tesoro
// En suspenso: NO se muestra la pista de las letras que forman la palabra durante el juego.
export interface IslandAdventure {
  word: string;
  themeName: string;
  description: string;
  items: { n1: number; n2: number; letter: string; ans: number }[];
}

export const ISLAND_ADVENTURES: IslandAdventure[] = [
  {
    word: 'CHILOE',
    themeName: 'Isla Misteriosa del Sur 🏰',
    description: 'Enigma de un archipiélago lleno de magia y secretos marinos.',
    items: [
      { n1: 486, n2: 2, letter: 'C', ans: 972 },
      { n1: 156, n2: 4, letter: 'H', ans: 624 },
      { n1: 248, n2: 4, letter: 'I', ans: 992 },
      { n1: 35, n2: 5, letter: 'L', ans: 175 },
      { n1: 199, n2: 5, letter: 'O', ans: 995 },
      { n1: 279, n2: 3, letter: 'E', ans: 837 },
    ]
  },
  {
    word: 'TESORO',
    themeName: 'El Enigma del Corsario 🏴‍☠️',
    description: 'Cofres antiguos cerrados con candados matemáticos.',
    items: [
      { n1: 140, n2: 3, letter: 'T', ans: 420 },
      { n1: 279, n2: 3, letter: 'E', ans: 837 },
      { n1: 185, n2: 2, letter: 'S', ans: 370 },
      { n1: 199, n2: 5, letter: 'O', ans: 995 },
      { n1: 174, n2: 4, letter: 'R', ans: 696 },
      { n1: 155, n2: 5, letter: 'O', ans: 775 },
    ]
  },
  {
    word: 'MAGIA',
    themeName: 'La Cueva Oculta ✨',
    description: 'Un misterio protegido por hechiceros de números.',
    items: [
      { n1: 238, n2: 4, letter: 'M', ans: 952 },
      { n1: 125, n2: 3, letter: 'A', ans: 375 },
      { n1: 196, n2: 4, letter: 'G', ans: 784 },
      { n1: 248, n2: 4, letter: 'I', ans: 992 },
      { n1: 215, n2: 3, letter: 'A', ans: 645 },
    ]
  },
  {
    word: 'PASCUA',
    themeName: 'Isla Perdida del Océano 🗿',
    description: 'Tierra lejana con monolitos de piedra que guardan una palabra oculta.',
    items: [
      { n1: 165, n2: 3, letter: 'P', ans: 495 },
      { n1: 142, n2: 5, letter: 'A', ans: 710 },
      { n1: 185, n2: 2, letter: 'S', ans: 370 },
      { n1: 486, n2: 2, letter: 'C', ans: 972 },
      { n1: 214, n2: 4, letter: 'U', ans: 856 },
      { n1: 125, n2: 3, letter: 'A', ans: 375 },
    ]
  },
  {
    word: 'ESTRELLA',
    themeName: 'El Archipiélago del Cielo 🌟',
    description: 'Un mapa estelar secreto con coordenadas escondidas.',
    items: [
      { n1: 279, n2: 3, letter: 'E', ans: 837 },
      { n1: 185, n2: 2, letter: 'S', ans: 370 },
      { n1: 140, n2: 3, letter: 'T', ans: 420 },
      { n1: 174, n2: 4, letter: 'R', ans: 696 },
      { n1: 156, n2: 4, letter: 'E', ans: 624 },
      { n1: 35, n2: 5, letter: 'L', ans: 175 },
      { n1: 42, n2: 5, letter: 'L', ans: 210 },
      { n1: 125, n2: 3, letter: 'A', ans: 375 },
    ]
  },
  {
    word: 'DELFIN',
    themeName: 'Arrecife Profundo 🐬',
    description: 'Criaturas de las aguas que custodian un mensaje oculto.',
    items: [
      { n1: 218, n2: 3, letter: 'D', ans: 654 },
      { n1: 279, n2: 3, letter: 'E', ans: 837 },
      { n1: 35, n2: 5, letter: 'L', ans: 175 },
      { n1: 180, n2: 4, letter: 'F', ans: 720 },
      { n1: 248, n2: 4, letter: 'I', ans: 992 },
      { n1: 135, n2: 5, letter: 'N', ans: 675 },
    ]
  },
  {
    word: 'PIRATA',
    themeName: 'El Galeón Fantasma ⚓',
    description: 'Una clave ancestral protegida por viejas cerraduras.',
    items: [
      { n1: 165, n2: 3, letter: 'P', ans: 495 },
      { n1: 125, n2: 3, letter: 'I', ans: 375 },
      { n1: 174, n2: 4, letter: 'R', ans: 696 },
      { n1: 142, n2: 5, letter: 'A', ans: 710 },
      { n1: 140, n2: 3, letter: 'T', ans: 420 },
      { n1: 215, n2: 3, letter: 'A', ans: 645 },
    ]
  }
];

// Generar una ronda de la Isla del Tesoro con palabra misteriosa (EN SUSPENSO)
// Multiplicaciones SIEMPRE horizontales
export function generateIslandTreasureExercises(preferredWord?: string): Exercise[] {
  let adventure = preferredWord
    ? ISLAND_ADVENTURES.find(a => a.word.toLowerCase() === preferredWord.toLowerCase())
    : undefined;

  if (!adventure) {
    const randomIndex = Math.floor(Math.random() * ISLAND_ADVENTURES.length);
    adventure = ISLAND_ADVENTURES[randomIndex];
  }

  const { word, themeName, description, items } = adventure;

  return items.map((item, idx) => ({
    id: `island-${word}-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    type: 'multiplication',
    num1: item.n1,
    num2: item.n2,
    operator: '×',
    correctAnswer: item.ans,
    options: generateDistractors(item.ans, 0, 25),
    categoryKey: 'island-treasure',
    layout: 'horizontal', // Multiplicación SIEMPRE horizontal
    contextQuestion: {
      story: `Cofre secreto #${idx + 1} del mapa misterioso 🗝️`,
      subQuestion: `Abre el cofre #${idx + 1} resolviendo: ¿Cuánto es ${item.n1} × ${item.n2}?`,
      unitLabel: `cofre #${idx + 1}`,
      iconName: 'island',
      visualHint: `${description} • Multiplica: ${item.n1} × ${item.n2}`,
      islandData: {
        targetWord: word,
        themeName,
        letter: item.letter,
        letterIndex: idx,
        totalLetters: items.length
      }
    }
  }));
}

// 7. Generador de rondas de ejercicios por modo
export function generateSessionExercises(
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
  selectedTable?: number,
  weakCategories: string[] = []
): Exercise[] {
  if (mode === 'island_treasure') {
    return generateIslandTreasureExercises();
  }

  const exercises: Exercise[] = [];

  for (let i = 0; i < 10; i++) {
    let ex: Exercise;

    if (mode === 'word_problems') {
      ex = generateWordProblemExercise();
    } else if (mode === 'regrouping_mult') {
      ex = generateRegroupingMultExercise();
    } else if (mode === 'multiplication') {
      ex = generateMultiplicationExercise(selectedTable);
    } else if (mode === 'addition') {
      const diff = i < 3 ? 'easy' : (i < 7 ? 'medium' : 'hard');
      ex = generateAdditionExercise(diff);
    } else if (mode === 'subtraction') {
      const forceRegroup = i % 2 === 0;
      ex = generateSubtractionExercise(forceRegroup);
    } else if (mode === 'drag_drop') {
      if (i % 3 === 0) {
        ex = generateMultiplicationExercise();
      } else if (i % 3 === 1) {
        ex = generateAdditionExercise('easy');
      } else {
        ex = generateSubtractionExercise(false);
      }
      ex.interactionStyle = 'drag_and_drop';
    } else if (mode === 'ai_recommended' && weakCategories.length > 0) {
      const targetCategory = weakCategories[i % weakCategories.length];
      if (targetCategory.startsWith('mult-')) {
        const tableNum = parseInt(targetCategory.replace('mult-', ''), 10) || 7;
        ex = generateMultiplicationExercise(tableNum);
      } else if (targetCategory.includes('sub')) {
        ex = generateSubtractionExercise(true);
      } else if (targetCategory.includes('word')) {
        ex = generateWordProblemExercise();
      } else {
        ex = generateAdditionExercise('medium');
      }
    } else {
      if (i === 0 || i === 5) {
        ex = generateWordProblemExercise();
      } else if (i === 2 || i === 7) {
        ex = generateRegroupingMultExercise();
      } else if (i < 4) {
        ex = generateMultiplicationExercise();
      } else if (i < 8) {
        ex = generateAdditionExercise('medium');
      } else {
        ex = generateSubtractionExercise(true);
      }
    }

    exercises.push(ex);
  }

  return exercises;
}

// 8. Generar juego de memoria / parejas mágicas (Memory Match)
export function generateMemoryPairs(count: number = 6): MatchCard[] {
  const pairs: { expression: string; result: number }[] = [
    { expression: '6 × 7', result: 42 },
    { expression: '8 × 8', result: 64 },
    { expression: '9 × 4', result: 36 },
    { expression: '7 × 8', result: 56 },
    { expression: '5 × 9', result: 45 },
    { expression: '12 × 3', result: 36 },
    { expression: '22 × 4', result: 88 },
    { expression: '143 × 2', result: 286 },
    { expression: '7 × 5', result: 35 },
    { expression: '9 × 5', result: 45 },
    { expression: '4 × 10', result: 40 },
    { expression: '3 × 6', result: 18 },
  ];

  const selectedPairs = shuffle(pairs).slice(0, count);
  const cards: MatchCard[] = [];

  selectedPairs.forEach((item, index) => {
    const pairId = `pair-${index}`;
    cards.push({
      id: `${pairId}-expr`,
      pairId,
      content: item.expression,
      isExpression: true,
      isMatched: false,
    });
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
