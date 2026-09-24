import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Bell, 
  Droplet, 
  AlertCircle, 
  LogOut, 
  Check, 
  Key,
  Smartphone,
  Save,
  Info
} from 'lucide-react';

export const PatientAccountView: React.FC = () => {
  const { 
    currentPatient, 
    logoutPatient, 
    showNotification,
    pushPermissionStatus,
    requestPushPermission,
    fcmToken,
    requestFirebasePushPermission,
    patientNotificationPrefs,
    updatePatientNotificationPrefs
  } = useClinic();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentPatient?.phone || '');
  const [emailInput, setEmailInput] = useState(currentPatient?.email || '');
  const [pinCurrentInput, setPinCurrentInput] = useState('');
  const [pinNewInput, setPinNewInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!currentPatient) return null;

  const handleSaveContact = () => {
    // In clinic context, update patient contact info
    currentPatient.phone = phoneInput;
    currentPatient.email = emailInput;
    setIsEditingContact(false);
    showNotification('Datos de contacto actualizados correctamente.', 'success');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinNewInput || pinNewInput.length < 4) {
      setPinMessage({ text: 'El nuevo PIN debe tener al menos 4 dígitos numéricos.', type: 'error' });
      return;
    }
    if (pinNewInput !== pinConfirmInput) {
      setPinMessage({ text: 'El nuevo PIN y su confirmación no coinciden.', type: 'error' });
      return;
    }
    currentPatient.pinCode = pinNewInput;
    setPinCurrentInput('');
    setPinNewInput('');
    setPinConfirmInput('');
    setPinMessage({ text: 'Tu PIN de acceso ha sido actualizado satisfactoriamente.', type: 'success' });
    showNotification('PIN de acceso actualizado.', 'success');
  };

  const handleTogglePush = async () => {
    try {
      await requestPushPermission();
      showNotification('Permisos de notificaciones actualizados.', 'info');
    } catch (err) {
      showNotification('No se pudieron activar las notificaciones en este navegador.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-600" />
          <span>Mi cuenta y perfil de paciente</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Revisa tu información personal registrada, gestiona tus canales de aviso y actualiza tus credenciales seguras.
        </p>
      </div>

      {/* Clinical Integrity Warning Banner strictly following requirement */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Protección de Datos Clínicos e Integridad Diagnóstica (ISO 15189):</p>
          <p className="text-amber-800 leading-relaxed">
            Tus informes, parámetros y diagnósticos validados están firmados digitalmente por el bacteriólogo y médico colegiado. Por norma legal y seguridad biomédica, estos registros no pueden ser alterados por el paciente. Solo los datos de contacto y preferencias de notificación pueden ser actualizados.
          </p>
        </div>
      </div>

      {/* Grid: Personal Info & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Identificación Clínica */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-600" />
              <span>Ficha de Identificación</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Verificado
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nombre completo:</span>
              <span className="font-bold text-slate-900 text-sm">{currentPatient.fullName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block font-medium">DNI / Documento:</span>
                <span className="font-mono font-bold text-slate-800">{currentPatient.nationalId || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Código de Paciente:</span>
                <span className="font-mono font-bold text-cyan-700">{currentPatient.patientCode || currentPatient.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block font-medium">Edad & Sexo:</span>
                <span className="font-semibold text-slate-800">
                  {currentPatient.age} años • {currentPatient.gender === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tipo de Sangre:</span>
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5" /> Grupo {currentPatient.bloodType || 'O+'}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-400 block font-medium">Alergias registradas:</span>
              <span className="font-medium text-slate-800">
                {currentPatient.allergies && currentPatient.allergies.length > 0 
                  ? currentPatient.allergies.join(', ') 
                  : 'Ninguna conocida'}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-slate-400 block font-medium">Dirección domiciliaria:</span>
              <span className="text-slate-700">{currentPatient.address || 'Santa Rosa, Guatemala'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contacto & Notificaciones */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-600" />
              <span>Canales de Contacto</span>
            </h3>
            {!isEditingContact ? (
              <button
                onClick={() => setIsEditingContact(true)}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer"
              >
                Editar
              </button>
            ) : (
              <button
                onClick={handleSaveContact}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block font-medium mb-1">Teléfono principal / WhatsApp:</label>
              {isEditingContact ? (
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800">{currentPatient.phone || '5612-5563'}</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Recepción de avisos
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 block font-medium mb-1">Correo electrónico:</label>
              {isEditingContact ? (
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-800">{currentPatient.email || 'No especificado'}</span>
                </div>
              )}
            </div>

            {/* Push Notifications Card */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Notificaciones Web Push</span>
                  <span className="text-[11px] text-slate-500">Avisos instantáneos cuando tu orden esté validada</span>
                </div>
                <button
                  onClick={handleTogglePush}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pushPermissionStatus === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-cyan-600 text-white hover:bg-cyan-500'
                  }`}
                >
                  {pushPermissionStatus === 'granted' ? 'Activado ✓' : 'Activar avisos'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Card 3: Seguridad & Cambio de PIN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-600" />
            <span>Seguridad & PIN de Acceso Rápido</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Código actual: {currentPatient.accessCode || 'MED-2041'}
          </span>
        </div>

        <form onSubmit={handleUpdatePin} className="space-y-3 max-w-md text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block font-semibold mb-1">Nuevo PIN (4 dígitos):</label>
              <input
                type="password"
                maxLength={6}
                value={pinNewInput}
                onChange={(e) => setPinNewInput(e.target.value)}
                placeholder="****"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-600 block font-semibold mb-1">Confirmar nuevo PIN:</label>
              <input
                type="password"
                maxLength={6}
                value={pinConfirmInput}
                onChange={(e) => setPinConfirmInput(e.target.value)}
                placeholder="****"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {pinMessage && (
            <p className={`text-xs font-semibold ${pinMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {pinMessage.text}
            </p>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Actualizar credencial de acceso
            </button>
          </div>
        </form>
      </div>

      {/* Logout button */}
      <div className="pt-2 flex items-center justify-end">
        <button
          onClick={logoutPatient}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar mi sesión privada de paciente</span>
        </button>
      </div>

    </div>
  );
};
