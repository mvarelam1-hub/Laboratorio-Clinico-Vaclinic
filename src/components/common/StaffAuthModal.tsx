import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Key, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FlaskConical,
  Eye,
  EyeOff
} from 'lucide-react';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const validPins = ['1234', 'admin', 'biomed', 'lis2026', 'staff'];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPin = pin.trim().toLowerCase();
    if (!cleanPin) {
      setError('Por favor ingresa tu clave o PIN de personal');
      return;
    }

    if (validPins.includes(cleanPin)) {
      setPin('');
      setError(null);
      onSuccess();
    } else {
      setError('PIN o credencial de personal incorrecta. Acceso restringido.');
    }
  };

  const handleKeypadPress = (val: string) => {
    setError(null);
    if (pin.length < 8) {
      setPin(prev => prev + val);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Acceso Restringido al Personal</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Área médica y laboratorio LIS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Área confidencial del personal</strong>
              <span>
                Los pacientes no tienen permitido ingresar al panel de redacción médica, analizadores ni gestión de otros usuarios.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Ingresa tu PIN o Clave de Personal LIS
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="PIN de Personal (ej. 1234)"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-black text-slate-900 tracking-widest focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Numeric Keypad for convenience */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-sm font-mono transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-sm font-mono transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>OK</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                PIN de personal: <strong>1234</strong>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancelar y regresar
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Verificar y Acceder al Sistema de Personal</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
