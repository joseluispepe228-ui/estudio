# 🚀 Guía de Despliegue en GitHub y Vercel

Esta aplicación está construida con **React + Vite + TypeScript + Tailwind CSS**, integrada con **Firebase Firestore** y la **API de Gemini (Google Gen AI SDK)**.

---

### 1. Subir a GitHub
1. Inicializa el repositorio si no lo tienes:
   ```bash
   git init
   git add .
   git commit -m "feat: Aventura Matemática PWA completa"
   ```
2. Crea un repositorio en tu cuenta de GitHub (ejemplo: `aventura-matematica`).
3. Vincula y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/aventura-matematica.git
   git branch -M main
   git push -u origin main
   ```

---

### 2. Desplegar en Vercel
1. Entra a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona tu repositorio `aventura-matematica` y pulsa **Import**.
4. En **Framework Preset**, Vercel detectará automáticamente **Vite**.
5. En la sección **Environment Variables**, añade las siguientes variables:
   - `GEMINI_API_KEY`: Tu clave API de Google AI Studio / Gemini.
   - `VITE_GEMINI_API_KEY`: (Opcional, si deseas que el cliente acceda a Gemini directamente).
6. Haz clic en **Deploy**. ¡En menos de 1 minuto tu PWA estará online con HTTPS y dominio gratuito de Vercel!

---

### 3. Esquema de Datos en Firebase Firestore

La aplicación organiza los datos en Firestore con la siguiente estructura JSON:

#### Colección `users/{userId}`:
```json
{
  "totalScore": 150,
  "totalStars": 35,
  "currentStreak": 5,
  "highestStreak": 8,
  "sessionsCount": 4,
  "level": 2,
  "accuracyByType": {
    "multiplication": { "correct": 28, "total": 30 },
    "addition": { "correct": 20, "total": 20 },
    "subtraction": { "correct": 14, "total": 20 }
  },
  "tableMastery": {
    "1": { "correct": 10, "total": 10, "avgTimeMs": 2400 },
    "7": { "correct": 4, "total": 10, "avgTimeMs": 6200 },
    "8": { "correct": 5, "total": 10, "avgTimeMs": 5900 }
  },
  "weakCategories": ["mult-7", "mult-8", "sub-regroup"],
  "aiRecommendations": {
    "summary": "Excelente dominio de sumas y multiplicaciones base. Recomendamos repasar la tabla del 7 y 8.",
    "suggestedFocus": ["Tabla del 7", "Tabla del 8"],
    "motivationalQuote": "¡Eres una superheroína de las matemáticas! 🌟",
    "generatedAt": 1727000000000
  }
}
```

#### Subcolección `users/{userId}/sessions/{sessionId}`:
```json
{
  "id": "session-1727000123",
  "timestamp": 1727000123000,
  "mode": "adventure",
  "selectedTable": 7,
  "totalExercises": 10,
  "correctCount": 9,
  "score": 90,
  "starsEarned": 9,
  "avgTimeSpentMs": 3400,
  "results": [
    {
      "exerciseId": "mult-1",
      "type": "multiplication",
      "prompt": "7 × 8",
      "num1": 7,
      "num2": 8,
      "userAnswer": 56,
      "correctAnswer": 56,
      "isCorrect": true,
      "timeSpentMs": 2800,
      "categoryKey": "mult-7"
    }
  ]
}
```

---

### 4. Instalación como PWA en Móvil / Tablet
- **Android (Chrome):** Toca el menú de 3 puntos (⋮) y selecciona **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**.
- **iOS (Safari):** Toca el botón Compartir y selecciona **"Añadir a pantalla de inicio"**.
