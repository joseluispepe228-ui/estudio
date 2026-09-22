import React, { useState } from 'react';
import { Download, Smartphone, ExternalLink, X, CheckCircle, Share, PlusSquare, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playSound } from '../utils/effects';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInstall: () => void;
  hasNativePrompt: boolean;
  isIOS: boolean;
  isInIframe: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerInstall,
  hasNativePrompt,
  isIOS,
  isInIframe,
}) => {
  if (!isOpen) return null;

  const currentUrl = window.location.href;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100 space-y-5 relative">
        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Instalar Aventura Matemática</h2>
            <p className="text-xs text-slate-500">Úsala como una app nativa en tu móvil o PC</p>
          </div>
        </div>

        {/* Caso 1: Tiene evento nativo listo en navegador soportado (Chrome / Edge / Android) */}
        {hasNativePrompt && !isInIframe && (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-2xl p-4 text-xs text-purple-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-600" /> ¡Tu navegador está listo para instalar!
              </p>
              <p>Haz clic abajo para agregar el icono de Sofía directamente a tu pantalla de inicio.</p>
            </div>
            <button
              onClick={() => {
                playSound('click');
                onTriggerInstall();
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Instalar Ahora en mi Dispositivo
            </button>
          </div>
        )}

        {/* Caso 2: Está corriendo dentro de un iframe (vista previa de AI Studio) */}
        {isInIframe && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-black text-amber-950 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-700" /> ¿Por qué no se abre el diálogo directo aquí?
              </p>
              <p>
                Por seguridad de Chrome, las aplicaciones no pueden instalarse <strong>dentro de una ventana incrustada (iframe)</strong>.
              </p>
              <p className="font-semibold">
                Debes abrir la app en una <strong>pestaña directa</strong> o visitarla desde tu teléfono móvil.
              </p>
            </div>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" /> Abrir en nueva pestaña para Instalar
            </a>
          </div>
        )}

        {/* Caso 3: Dispositivo iOS / Safari (iPhone o iPad) */}
        {isIOS && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                🍎 En iPhone o iPad (Safari):
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                <li>
                  Toca el botón <strong className="inline-flex items-center gap-1 px-1 bg-slate-200 rounded"><Share className="w-3 h-3" /> Compartir</strong> en la barra inferior de Safari.
                </li>
                <li>
                  Desliza hacia abajo y selecciona <strong className="inline-flex items-center gap-1 px-1 bg-slate-200 rounded"><PlusSquare className="w-3 h-3" /> Agregar a pantalla de inicio</strong>.
                </li>
                <li>Toca <strong>Agregar</strong> en la esquina superior derecha.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Caso 4: Instrucciones generales para Chrome / Edge de escritorio o Android */}
        {!hasNativePrompt && !isIOS && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-slate-700" /> Instalación manual en tu navegador:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 font-medium">
                <li>
                  <strong>Chrome en PC/Mac:</strong> Haz clic en el icono de <strong>Instalar</strong> en la barra de direcciones (esquina derecha, al lado de la estrella de favoritos).
                </li>
                <li>
                  <strong>Chrome en Android:</strong> Toca los <strong>tres puntos (⋮)</strong> en la esquina superior y pulsa <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
