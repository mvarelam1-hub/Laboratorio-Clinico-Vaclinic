import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, FastForward } from 'lucide-react';

interface AudioDoctorPlayerProps {
  doctorName?: string;
  doctorSpecialty?: string;
  explanationText: string;
  recommendations?: string[];
  reportTitle: string;
}

export const AudioDoctorPlayer: React.FC<AudioDoctorPlayerProps> = ({
  doctorName = 'Dr. Alejandro Valenzuela Morales',
  doctorSpecialty = 'Especialista en Diagnóstico Clínico',
  explanationText,
  recommendations = [],
  reportTitle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Full text to speak
  const fullSpeechText = `Informe de ${reportTitle}. Explicación médica: ${explanationText}. Indicaciones de cuidado: ${recommendations.join('. ')}`;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startSpeaking = () => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(fullSpeechText);
    utterance.lang = 'es-ES';
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;

    // Pick a natural Spanish voice if available
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Sabina') || v.name.includes('Jorge')));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setProgress(0);
      const estDurationMs = (fullSpeechText.length / 15) * 1000 / playbackSpeed;
      const startTime = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(100, (elapsed / estDurationMs) * 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(progressIntervalRef.current);
        }
      }, 200);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        startSpeaking();
      }
    }
  };

  const handleReset = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleSpeedChange = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
    setPlaybackSpeed(nextSpeed);
    if (isPlaying) {
      handleReset();
      setTimeout(() => startSpeaking(), 100);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-teal-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Doctor Info & Waveform */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 flex-shrink-0 shadow-inner">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 bg-teal-900/60 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Resumen por Voz
              </span>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                {doctorSpecialty}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Escuchar explicación del especialista
            </h4>
            <p className="text-[11px] text-slate-400">
              {doctorName}
            </p>
          </div>
        </div>

        {/* Audio Waveform Animation (Simulated) */}
        <div className="hidden md:flex items-center gap-1 h-7 px-3 bg-slate-950/60 rounded-xl border border-slate-800">
          {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 70, 50, 85].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.7)))}%` : '25%',
                animationDelay: `${i * 70}ms`
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleSpeedChange}
            className="text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Velocidad de reproducción"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Reiniciar audio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Escuchar</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
