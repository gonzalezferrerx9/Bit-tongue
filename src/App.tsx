// —-----------------------------------------------------------
// – IMPORTACIONES / IMPORTS
// —---------------------------------------------------------
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Volume2, AlertCircle, Loader2, Globe, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DubbingState, DubbingMessage } from './types';
import { GeminiDubbingService } from './services/geminiService';
import { TongueLogo } from './components/TongueLogo';
import { UI_TRANSLATIONS } from './constants';

// —-----------------------------------------------------------
// – COMPONENTE PRINCIPAL / MAIN COMPONENT
// —---------------------------------------------------------
export default function App() {
  // —-----------------------------------------------------------
  // – ESTADOS Y REFERENCIAS / STATES AND REFS
  // —---------------------------------------------------------
  const [state, setState] = useState<DubbingState>(DubbingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1.0);
  const [language, setLanguage] = useState('EN-US');
  const [uiLanguage, setUiLanguage] = useState<'en' | 'es'>('en');
  const [showSettings, setShowSettings] = useState(false);
  const serviceRef = useRef<GeminiDubbingService | null>(null);

  const t = UI_TRANSLATIONS[uiLanguage];

  // —-----------------------------------------------------------
  // – EFECTOS / EFFECTS
  // —---------------------------------------------------------
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.setLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const handleMessage = (message: DubbingMessage) => {
      if (message.type === 'STATE_CHANGE') {
        setState(message.payload);
      } else if (message.type === 'ERROR') {
        setState(DubbingState.ERROR);
        setError(message.payload);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
    };
  }, []);

  // —-----------------------------------------------------------
  // – MANEJADORES DE EVENTOS / EVENT HANDLERS
  // —---------------------------------------------------------
  const toggleDubbing = () => {
    if (state === DubbingState.IDLE || state === DubbingState.ERROR) {
      setState(DubbingState.CONNECTING);
      setError(null);

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.offscreen) {
        chrome.runtime.sendMessage({ type: 'START_DUBBING' });
      } else {
        if (!serviceRef.current) {
          serviceRef.current = new GeminiDubbingService(
            (s) => setState(s),
            (e) => {
              setState(DubbingState.ERROR);
              setError(e);
            }
          );
          serviceRef.current.setVolume(volume);
          serviceRef.current.setLanguage(language);
        }
        serviceRef.current.start();
      }
    } else {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.offscreen) {
        chrome.runtime.sendMessage({ type: 'STOP_DUBBING' });
      } else if (serviceRef.current) {
        serviceRef.current.stop();
      }
      setState(DubbingState.IDLE);
    }
  };

  // —-----------------------------------------------------------
  // – RENDERIZADO / RENDERING
  // —---------------------------------------------------------
  return (
    <div className="w-[360px] min-h-[640px] bg-[#0A0A0A] text-white font-sans p-8 flex flex-col items-center justify-between overflow-hidden relative mx-auto rounded-[32px] shadow-2xl border border-white/10">
      <div className="absolute inset-0 bg-[#0A0A0A]" />

      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <TongueLogo className="w-7 h-7 opacity-90" />
          </div>
          <span className="font-semibold tracking-tight text-xl text-white/90">BitTongue</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 hover:bg-white/5 rounded-full transition-colors ${showSettings ? 'text-white' : 'text-zinc-500'}`}
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 z-20 overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3" />
                    <span>{t.volumeLabel}</span>
                  </div>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Globe className="w-3 h-3" />
                  <span>{t.targetLanguageLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage('ES-LATAM')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${language === 'ES-LATAM'
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    ES-LATAM
                  </button>
                  <button
                    onClick={() => setLanguage('EN-US')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${language === 'EN-US'
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    EN-US
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Globe className="w-3 h-3" />
                  <span>{t.uiLanguageLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUiLanguage('en')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${uiLanguage === 'en'
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    ENGLISH
                  </button>
                  <button
                    onClick={() => setUiLanguage('es')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${uiLanguage === 'es'
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    ESPAÑOL
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 z-10 w-full">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleDubbing}
            className={`w-44 h-44 rounded-full flex items-center justify-center relative z-20 transition-all duration-500 border-2 ${state === DubbingState.ACTIVE
              ? 'bg-white/10 border-white shadow-[0_0_40px_rgba(255,255,255,0.1)]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
          >
            <AnimatePresence mode="wait">
              {state === DubbingState.CONNECTING ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic className={`w-16 h-16 ${state === DubbingState.ACTIVE ? 'text-white' : 'text-white/80'}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white/90">
            {state === DubbingState.IDLE && t.idleTitle}
            {state === DubbingState.CONNECTING && t.connectingTitle}
            {state === DubbingState.ACTIVE && t.activeTitle}
            {state === DubbingState.ERROR && t.errorTitle}
          </h2>
          <p className="text-zinc-500 text-base max-w-[260px] mx-auto leading-relaxed">
            {state === DubbingState.IDLE && t.idleDesc}
            {state === DubbingState.CONNECTING && t.connectingDesc}
            {state === DubbingState.ACTIVE && t.activeDesc}
            {state === DubbingState.ERROR && error}
          </p>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 z-10 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.07]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">{t.latencyLabel}</span>
          <div className="text-2xl font-medium text-white/90">
            {state === DubbingState.ACTIVE ? "42ms" : "--"}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.07]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">{t.languageLabel}</span>
          <div className="text-xl font-medium text-white/90">{(t.languages as any)[language] || language}</div>
        </div>
      </div>

      <AnimatePresence>
        {state === DubbingState.ERROR && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-white/10 border border-white/20 p-3 rounded-xl flex items-center gap-3 z-30"
          >
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <span className="text-xs text-zinc-300 line-clamp-2">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}