import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Sparkles, 
  FileCheck, 
  Search, 
  KeyRound, 
  UserCheck, 
  Clock, 
  Eye, 
  Printer, 
  ExternalLink,
  Smartphone,
  Check,
  RefreshCw,
  Camera,
  UserPlus,
  Trash2,
  SlidersHorizontal,
  BadgeCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { BiometricService, BiometricHardwareCapability, BiometricAuthResult } from '../../services/biometricService';
import { LabOrder, LabStaffUser, StaffBiometricCredential } from '../../types';
import { BiometricAuthModal } from './BiometricAuthModal';
import { FingerprintEnrollmentModal } from './FingerprintEnrollmentModal';
import { FingerprintVerifyModal } from './FingerprintVerifyModal';

export const BiometricSecuritySection: React.FC = () => {
  const { 
    orders, 
    updateOrder, 
    currentStaffUser, 
    showNotification,
    staffUsers,
    updateStaffUser,
    logAuditEvent,
    setStaffActiveTab
  } = useClinic();

  const [activeTab, setActiveTab] = useState<'staff_fingerprints' | 'critical_orders'>('staff_fingerprints');
  const [hardware, setHardware] = useState<BiometricHardwareCapability | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [selectedOrderToAuth, setSelectedOrderToAuth] = useState<LabOrder | null>(null);
  
  // Orders filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'authorized'>('all');

  // Staff biometric management states
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState<'all' | 'enrolled' | 'pending'>('all');
  const [enrollModalUser, setEnrollModalUser] = useState<LabStaffUser | null>(null);
  const [verifyModalUser, setVerifyModalUser] = useState<LabStaffUser | null>(null);
  const [verifyModalCred, setVerifyModalCred] = useState<StaffBiometricCredential | undefined>(undefined);

  useEffect(() => {
    refreshHardware();
  }, []);

  const refreshHardware = async () => {
    setIsProbing(true);
    try {
      const hw = await BiometricService.probeHardware();
      setHardware(hw);
    } finally {
      setIsProbing(false);
    }
  };

  // Staff enrollment handler
  const handleStaffEnrolled = (updatedUser: LabStaffUser, newCred: StaffBiometricCredential) => {
    updateStaffUser(updatedUser.id, {
      biometricEnrolled: true,
      biometricLastAuthAt: new Date().toISOString(),
      biometricCredentials: updatedUser.biometricCredentials
    });

    logAuditEvent({
      userId: currentStaffUser?.id || 'usr-admin',
      userName: currentStaffUser?.fullName || 'Administrador VACLINIC',
      userRole: currentStaffUser?.roleName || 'Director Técnico',
      action: 'Registro de Huella Dactilar WebAuthn',
      module: 'seguridad',
      details: `Huella dactilar (${newCred.fingerLabel} - ${newCred.name}) registrada exitosamente mediante WebAuthn FIDO2 para ${updatedUser.fullName}.`
    });

    showNotification(`¡Huella dactilar (${newCred.fingerLabel}) registrada para ${updatedUser.fullName}!`, 'success');
  };

  // Revoke biometric credential
  const handleRevokeFingerprint = (user: LabStaffUser, credId: string) => {
    if (window.confirm(`¿Está seguro de revocar esta credencial de huella dactilar para ${user.fullName}? Esta acción quedará registrada en la auditoría de seguridad.`)) {
      const currentCreds = user.biometricCredentials || [];
      const updatedCreds = currentCreds.filter(c => c.id !== credId);
      
      updateStaffUser(user.id, {
        biometricEnrolled: updatedCreds.length > 0,
        biometricCredentials: updatedCreds
      });

      logAuditEvent({
        userId: currentStaffUser?.id || 'usr-admin',
        userName: currentStaffUser?.fullName || 'Administrador VACLINIC',
        userRole: currentStaffUser?.roleName || 'Director Técnico',
        action: 'Revocación de Huella Dactilar',
        module: 'seguridad',
        details: `Credencial biométrica revocada para ${user.fullName}.`
      });

      showNotification(`Credencial biométrica revocada para ${user.fullName}`, 'info');
    }
  };

  // Filter orders
  const highRiskOrders = orders.filter(o => {
    const isStat = o.priority === 'stat_panico' || o.priority === 'urgente';
    const hasRiskKeywords = o.testsList.some(t => 
      t.toLowerCase().includes('troponina') || 
      t.toLowerCase().includes('dímero') || 
      t.toLowerCase().includes('gasometría') ||
      t.toLowerCase().includes('vih') ||
      t.toLowerCase().includes('toxicolog') ||
      t.toLowerCase().includes('quimioterapia')
    );
    return o.isHighRisk ?? (isStat || hasRiskKeywords);
  });

  const filteredOrders = highRiskOrders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.patientName.toLowerCase().includes(search.toLowerCase()) ||
      o.nationalId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'pending') return !o.biometricAuthorized;
    if (filterType === 'authorized') return !!o.biometricAuthorized;
    return true;
  });

  // Filter staff users
  const filteredStaff = staffUsers.filter(u => {
    const hasCreds = u.biometricEnrolled || (u.biometricCredentials && u.biometricCredentials.length > 0);
    
    if (staffFilter === 'enrolled' && !hasCreds) return false;
    if (staffFilter === 'pending' && hasCreds) return false;

    if (!staffSearch.trim()) return true;

    const term = staffSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.roleName.toLowerCase().includes(term) ||
      u.licenseNumber.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
    );
  });

  const enrolledStaffCount = staffUsers.filter(u => u.biometricEnrolled || (u.biometricCredentials && u.biometricCredentials.length > 0)).length;
  const pendingStaffCount = staffUsers.length - enrolledStaffCount;

  const handleBiometricAuthorized = (orderId: string, authResult: BiometricAuthResult) => {
    updateOrder(orderId, {
      biometricAuthorized: true,
      isHighRisk: true,
      biometricAuthData: {
        method: authResult.method,
        authorizedBy: authResult.userName,
        staffRole: authResult.userRole,
        timestamp: authResult.timestamp,
        credentialId: authResult.credentialId,
        confidenceScore: authResult.confidenceScore,
        deviceType: authResult.hardwareDevice
      }
    });

    logAuditEvent({
      userId: currentStaffUser?.id || 'usr-admin',
      userName: authResult.userName,
      userRole: authResult.userRole,
      action: 'Autorización Biométrica de Orden',
      module: 'seguridad',
      details: `Orden ${orderId} autorizada con método ${authResult.method} (ID Credencial: ${authResult.credentialId}).`
    });

    showNotification(`¡Orden ${orderId} autorizada biométricamente por ${authResult.userName}!`, 'success');
  };

  const handleRevokeAuthorization = (order: LabOrder) => {
    if (window.confirm(`¿Desea revocar el sello biométrico de la orden ${order.orderNumber}?`)) {
      updateOrder(order.id, {
        biometricAuthorized: false,
        biometricAuthData: undefined
      });

      logAuditEvent({
        userId: currentStaffUser?.id || 'usr-admin',
        userName: currentStaffUser?.fullName || 'Personal VACLINIC',
        userRole: currentStaffUser?.roleName || 'Usuario',
        action: 'Revocación de Sello Biométrico',
        module: 'seguridad',
        details: `Sello biométrico revocado para orden ${order.orderNumber}.`
      });

      showNotification(`Autorización biométrica revocada para orden ${order.orderNumber}`, 'info');
    }
  };

  const pendingOrdersCount = highRiskOrders.filter(o => !o.biometricAuthorized).length;
  const authorizedOrdersCount = highRiskOrders.filter(o => o.biometricAuthorized).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/15 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-inner">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Biometría y Acceso Seguro
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                    FIPS 140-2 / WebAuthn Level 3
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Registro de huellas dactilares FIDO2 para el personal y sello biométrico de órdenes críticas STAT y alta sensibilidad.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action & Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setEnrollModalUser(currentStaffUser || staffUsers[0])}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Registrar Mi Huella (WebAuthn)</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5 px-3.5 text-center min-w-[84px]">
                <span className="text-xl font-black text-emerald-400">{enrolledStaffCount}</span>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Enrolados</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5 px-3.5 text-center min-w-[84px]">
                <span className="text-xl font-black text-rose-400">{pendingOrdersCount}</span>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">STAT Pend.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('staff_fingerprints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff_fingerprints'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Registro de Huellas del Personal</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeTab === 'staff_fingerprints' ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {staffUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('critical_orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'critical_orders'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Órdenes Críticas y Sellos Biométricos</span>
          {pendingOrdersCount > 0 && (
            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono animate-pulse">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: STAFF BIOMETRIC REGISTRATION (WEBAUTHN) */}
      {activeTab === 'staff_fingerprints' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Hardware Probing Diagnostic Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    Lector Biométrico Conectado
                    {hardware?.isPlatformAuthenticatorAvailable ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        Sensor Nativo WebAuthn Activo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
                        Lector Óptico LIS FIDO2 Activo
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dispositivo: <strong className="text-slate-700 dark:text-slate-300">{hardware?.deviceLabel || 'Detectando sensor biométrico...'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={refreshHardware}
                  disabled={isProbing}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Volver a escanear lectores biométricos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                  <span>{isProbing ? 'Consultando...' : 'Reescanear Sensor'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                placeholder="Buscar personal por nombre, cargo o colegiado..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setStaffFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    staffFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todos ({staffUsers.length})
                </button>
                <button
                  onClick={() => setStaffFilter('enrolled')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    staffFilter === 'enrolled'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Enrolados ({enrolledStaffCount})
                </button>
                <button
                  onClick={() => setStaffFilter('pending')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    staffFilter === 'pending'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pendientes ({pendingStaffCount})
                </button>
              </div>
            </div>
          </div>

          {/* Staff Biometrics Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Personal / Profesional</th>
                    <th className="py-3 px-4">Rol en Laboratorio</th>
                    <th className="py-3 px-4">Estado Biométrico</th>
                    <th className="py-3 px-4">Huella / Credencial WebAuthn</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No se encontró personal con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(user => {
                      const credentials = user.biometricCredentials || [];
                      const isEnrolled = user.biometricEnrolled || credentials.length > 0;
                      const primaryCred = credentials[0];

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* User info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-teal-600'} text-white font-bold flex items-center justify-center shadow-xs shrink-0`}>
                                {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {user.fullName}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Col. {user.licenseNumber || 'N/A'} • @{user.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {user.roleName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {user.specialty}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isEnrolled ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                  Huella Activa
                                </span>
                                {user.biometricLastAuthAt && (
                                  <span className="text-[10px] text-slate-400 block">
                                    Último uso: {new Date(user.biometricLastAuthAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Sin Huella Registrada
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Requiere enrolamiento
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Credential Details */}
                          <td className="py-3.5 px-4">
                            {isEnrolled && primaryCred ? (
                              <div className="space-y-0.5 text-[11px] font-mono">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <Fingerprint className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  <span>{primaryCred.fingerLabel || 'Índice'}</span>
                                  {primaryCred.isNativeWebAuthn && (
                                    <span className="text-[9px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1 rounded">
                                      FIDO2
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={primaryCred.name}>
                                  {primaryCred.name}
                                </div>
                                <div className="text-[9px] text-slate-400 truncate max-w-[200px]" title={primaryCred.credentialId}>
                                  ID: {primaryCred.credentialId}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Pendiente de vinculación
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEnrolled ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setVerifyModalUser(user);
                                      setVerifyModalCred(primaryCred);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-teal-200 dark:border-teal-800"
                                    title="Probar huella registrada con desafío WebAuthn"
                                  >
                                    <Fingerprint className="w-3.5 h-3.5" />
                                    <span>Probar</span>
                                  </button>

                                  <button
                                    onClick={() => setEnrollModalUser(user)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                    title="Añadir otro dedo o lector"
                                  >
                                    + Añadir
                                  </button>

                                  {primaryCred && (
                                    <button
                                      onClick={() => handleRevokeFingerprint(user, primaryCred.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Revocar credencial"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => setEnrollModalUser(user)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Fingerprint className="w-3.5 h-3.5" />
                                  <span>Enrolar Huella</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Standards Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cumplimiento FIPS 140-2 / WebAuthn</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Las plantillas biométricas y claves privadas residen en el Enclave Seguro o módulo TPM del hardware, impidiendo cualquier clonación o filtración.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                <span>Criptografía Asimétrica ES256</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cada autorización biométrica genera una firma criptográfica única ECDSA con SHA-256 vinculada al número de orden clínica.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Auditoría y Trazabilidad LIS</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Registro inmutable de fecha, hora, identidad del profesional, colegiado y dispositivo utilizado para emisión de resultados de pánico.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CRITICAL ORDERS & BIOMETRIC SEALS */}
      {activeTab === 'critical_orders' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Current Staff User Biometric Status Alert */}
          {currentStaffUser && !(currentStaffUser.biometricEnrolled || (currentStaffUser.biometricCredentials && currentStaffUser.biometricCredentials.length > 0)) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Tu usuario aún no cuenta con huella dactilar registrada</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Para autorizar órdenes STAT Pánico o de alta sensibilidad con tu sello personal, es necesario registrar tu huella WebAuthn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnrollModalUser(currentStaffUser)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Registrar Mi Huella Ahora</span>
              </button>
            </div>
          )}

          {/* Orders Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>Órdenes de Alto Riesgo que Requieren Sello Biométrico</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {filteredOrders.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estudios con valores de pánico, drogas de abuso, VIH o perfiles oncológicos con validación estricta de dos factores físicos.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por orden, paciente o DPI..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-52 sm:w-64"
                  />
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === 'all' 
                        ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Todas ({highRiskOrders.length})
                  </button>
                  <button
                    onClick={() => setFilterType('pending')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === 'pending' 
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pendientes ({pendingOrdersCount})
                  </button>
                  <button
                    onClick={() => setFilterType('authorized')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === 'authorized' 
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Autorizadas ({authorizedOrdersCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Orden / Fecha</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Estudios Críticos</th>
                    <th className="py-3 px-4">Estado Biométrico</th>
                    <th className="py-3 px-4">Firma & Credencial</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No hay órdenes críticas bajo los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isAuth = !!ord.biometricAuthorized;
                      const authData = ord.biometricAuthData;

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Order & Date */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{ord.orderNumber}</span>
                            <span className="text-[11px] text-slate-400">
                              {ord.date} {ord.time ? `• ${ord.time}` : (ord.createdAt ? `• ${new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '')}
                            </span>
                          </td>

                          {/* Patient */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{ord.patientName}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">DPI: {ord.nationalId}</span>
                          </td>

                          {/* Critical Tests */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {ord.testsList.map((test, i) => (
                                <span 
                                  key={i} 
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                                >
                                  {test}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Biometric Status Badge */}
                          <td className="py-3.5 px-4">
                            {isAuth ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>AUTORIZADA</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 animate-pulse">
                                <Lock className="w-3 h-3" />
                                <span>SELLO REQUERIDO</span>
                              </div>
                            )}
                          </td>

                          {/* Authorization Details */}
                          <td className="py-3.5 px-4">
                            {isAuth && authData ? (
                              <div className="text-[11px] space-y-0.5 font-mono text-slate-600 dark:text-slate-400">
                                <p>
                                  <strong className="text-slate-800 dark:text-slate-200">{authData.authorizedBy}</strong> ({authData.staffRole})
                                </p>
                                <p className="text-slate-400 text-[10px]">
                                  {new Date(authData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {authData.method.toUpperCase()}
                                </p>
                                <p className="text-emerald-700 dark:text-emerald-400 text-[9px] font-bold">
                                  ID: {authData.credentialId}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Pendiente de lectura</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            {!isAuth ? (
                              <button
                                onClick={() => setSelectedOrderToAuth(ord)}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Fingerprint className="w-3.5 h-3.5" />
                                <span>Autorizar Biometría</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Validado</span>
                                <button
                                  onClick={() => handleRevokeAuthorization(ord)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                  title="Revocar autorización biométrica"
                                >
                                  Revocar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Staff Fingerprint Enrollment (WebAuthn) */}
      {enrollModalUser && (
        <FingerprintEnrollmentModal
          isOpen={!!enrollModalUser}
          onClose={() => setEnrollModalUser(null)}
          targetUser={enrollModalUser}
          onEnrolled={handleStaffEnrolled}
        />
      )}

      {/* MODAL 2: Staff Fingerprint Verification (WebAuthn Challenge Test) */}
      {verifyModalUser && (
        <FingerprintVerifyModal
          isOpen={!!verifyModalUser}
          onClose={() => {
            setVerifyModalUser(null);
            setVerifyModalCred(undefined);
          }}
          staffUser={verifyModalUser}
          credential={verifyModalCred}
          onVerified={(result) => {
            logAuditEvent({
              userId: verifyModalUser.id,
              userName: verifyModalUser.fullName,
              userRole: verifyModalUser.roleName,
              action: 'Prueba de Verificación WebAuthn',
              module: 'seguridad',
              details: `Desafío WebAuthn superado con éxito (${(result.confidenceScore * 100).toFixed(1)}% de coincidencia).`
            });
            showNotification(`¡Identidad biométrica dactilar verificada con éxito para ${verifyModalUser.fullName}!`, 'success');
          }}
        />
      )}

      {/* MODAL 3: Order Biometric Authorization Modal */}
      <BiometricAuthModal
        isOpen={!!selectedOrderToAuth}
        onClose={() => setSelectedOrderToAuth(null)}
        order={selectedOrderToAuth}
        staffName={currentStaffUser?.fullName || 'Lic. Mily Jeannette Rodríguez Magaña'}
        staffRole={currentStaffUser?.roleName || 'Químico Biólogo / Director Técnico'}
        onAuthorized={handleBiometricAuthorized}
      />
    </div>
  );
};
