import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import configData from '../../firebase-applet-config.json';

// Configuración de Firebase obtenida de la provisión automática
export const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
  firestoreDatabaseId: configData.firestoreDatabaseId || '(default)'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

// ID global compartido para sincronización en tiempo real entre teléfono, tablet y ordenador de Sofía
export const SHARED_STUDENT_ID = 'sofia_shared_math_profile';

// Iniciar sesión anónima automáticamente si no está autenticado
export async function ensureAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('Advertencia en autenticación de Firebase:', err);
    }
  }
  return auth.currentUser;
}
