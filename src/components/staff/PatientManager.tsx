import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types';
import { PatientHistoryPdfModal } from '../patient/PatientHistoryPdfModal';
import { PatientOrderHistoryModal } from './PatientOrderHistoryModal';
import { EditPatientModal } from './EditPatientModal';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone, 
  Mail, 
  Droplet, 
  ShieldAlert, 
  FileText, 
  ArrowUpRight, 
  Trash2, 
  Edit, 
  Download, 
  Copy, 
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  User,
  SlidersHorizontal,
  MessageSquare,
  X
} from 'lucide-react';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';

type TimeFilterMode = 'all' | 'day' | 'week' | 'month' | 'year';

export const PatientManager: React.FC = () => {
  const { 
    patients, 
    addPatient, 
    deletePatient, 
    orders,
    reports, 
    setRole, 
    setSelectedPatientId,
    setStaffActiveTab,
    setActiveReportToEdit,
    showNotification
  } = useClinic();

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterMode>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'code'>('code');

  // Temporal Navigation States
  // Default reference date: 2026-08-31
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-31');
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 0-indexed: 7 = Agosto
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('2026-08-25');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [patientForOrdersHistory, setPatientForOrdersHistory] = useState<Patient | null>(null);
  const [patientForHistoryPdf, setPatientForHistoryPdf] = useState<Patient | null>(null);
  const [patientForWhatsApp, setPatientForWhatsApp] = useState<Patient | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Patient Form State
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState<'M' | 'F' | 'Otro'>('M');
  const [age, setAge] = useState<number>(36);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [allergies, setAllergies] = useState('Ninguna');
  const [address, setAddress] = useState('');
  const [customRegDate, setCustomRegDate] = useState('2026-08-31');

  // Helper function to safely parse a patient's registration date
  const getPatientDate = (patient: Patient): Date => {
    try {
      if (patient.createdAt) {
        const d = new Date(patient.createdAt);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {
      console.error(e);
    }
    return new Date('2026-08-31');
  };

  // Helper date formatters
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Calculate counts for each time tab
  const tabCounts = useMemo(() => {
    const todayStr = '2026-08-31';
    const thisWeekStartStr = '2026-08-25';
    const thisWeekEndStr = '2026-08-31';

    let dayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;

    patients.forEach((p) => {
      const pDate = getPatientDate(p);
      const pDateStr = formatDateString(pDate);

      // Day match (matches selectedDate)
      if (pDateStr === selectedDate) {
        dayCount++;
      }

      // Week match (matches current week window)
      if (pDateStr >= thisWeekStartStr && pDateStr <= thisWeekEndStr) {
        weekCount++;
      }

      // Month match (matches selected month and year)
      if (pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear) {
        monthCount++;
      }

      // Year match (matches selected year)
      if (pDate.getFullYear() === selectedYear) {
        yearCount++;
      }
    });

    return {
      all: patients.length,
      day: dayCount,
      week: weekCount,
      month: monthCount,
      year: yearCount
    };
  }, [patients, selectedDate, selectedMonth, selectedYear]);

  // Filter patients based on time, search, and demographics
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Time filter
        const pDate = getPatientDate(p);
        const pDateStr = formatDateString(pDate);

        if (timeFilter === 'day') {
          if (pDateStr !== selectedDate) return false;
        } else if (timeFilter === 'week') {
          const weekStart = new Date(selectedWeekStart);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekEndStr = formatDateString(weekEnd);
          if (pDateStr < selectedWeekStart || pDateStr > weekEndStr) return false;
        } else if (timeFilter === 'month') {
          if (pDate.getMonth() !== selectedMonth || pDate.getFullYear() !== selectedYear) {
            return false;
          }
        } else if (timeFilter === 'year') {
          if (pDate.getFullYear() !== selectedYear) return false;
        }

        // Gender filter
        if (genderFilter !== 'all' && p.gender !== genderFilter) {
          return false;
        }

        // Text Search
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchName = p.fullName.toLowerCase().includes(q);
          const matchDoc = p.nationalId && p.nationalId.toLowerCase().includes(q);
          const matchCode = p.patientCode && p.patientCode.toLowerCase().includes(q);
          const matchPin = p.accessCode && p.accessCode.toLowerCase().includes(q);
          const matchPhone = p.phone && p.phone.toLowerCase().includes(q);
          const matchEmail = p.email && p.email.toLowerCase().includes(q);
          if (!matchName && !matchDoc && !matchCode && !matchPin && !matchPhone && !matchEmail) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        if (sortBy === 'name-desc') {
          return b.fullName.localeCompare(a.fullName);
        }
        if (sortBy === 'code') {
          const codeA = a.patientCode || a.id;
          const codeB = b.patientCode || b.id;
          return codeA.localeCompare(codeB, undefined, { numeric: true });
        }
        return 0;
      });
  }, [patients, timeFilter, selectedDate, selectedWeekStart, selectedMonth, selectedYear, genderFilter, search, sortBy]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const cur = new Date(selectedDate + 'T12:00:00');
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(formatDateString(cur));
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate + 'T12:00:00');
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(formatDateString(cur));
  };

  const handleToday = () => {
    setSelectedDate('2026-08-31');
  };

  const handlePrevWeek = () => {
    const cur = new Date(selectedWeekStart + 'T12:00:00');
    cur.setDate(cur.getDate() - 7);
    setSelectedWeekStart(formatDateString(cur));
  };

  const handleNextWeek = () => {
    const cur = new Date(selectedWeekStart + 'T12:00:00');
    cur.setDate(cur.getDate() + 7);
    setSelectedWeekStart(formatDateString(cur));
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart('2026-08-25');
  };

  const monthsList = [
    { id: 0, name: 'Enero', short: 'Ene' },
    { id: 1, name: 'Febrero', short: 'Feb' },
    { id: 2, name: 'Marzo', short: 'Mar' },
    { id: 3, name: 'Abril', short: 'Abr' },
    { id: 4, name: 'Mayo', short: 'May' },
    { id: 5, name: 'Junio', short: 'Jun' },
    { id: 6, name: 'Julio', short: 'Jul' },
    { id: 7, name: 'Agosto', short: 'Ago' },
    { id: 8, name: 'Septiembre', short: 'Sep' },
    { id: 9, name: 'Octubre', short: 'Oct' },
    { id: 10, name: 'Noviembre', short: 'Nov' },
    { id: 11, name: 'Diciembre', short: 'Dic' }
  ];

  const yearsList = [2026, 2025, 2024, 2023];

  const calculateAge = (dateStr: string) => {
    try {
      const birth = new Date(dateStr);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return 30;
    }
  };

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    setAge(calculateAge(val));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('Ingresa el nombre del paciente', 'warning');
      return;
    }

    const nextSeq = patients.length + 1;
    const autoCode = `VAC-${String(nextSeq).padStart(6, '0')}`;

    const allergyList = allergies
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    // `addPatient` ahora es asíncrono: intenta crear el paciente de verdad
    // en el backend (POST /api/pacientes) antes de devolver el objeto, así
    // que el `id` que se usa de aquí en adelante (para el modal de
    // WhatsApp, etc.) es el id real de la base de datos, no uno inventado
    // en el navegador. Ver el comentario junto a `addPatient` en
    // ClinicContext.tsx para el detalle del fallback sin conexión.
    const newPat = await addPatient({
      fullName: fullName.toUpperCase(),
      patientCode: autoCode,
      nationalId: nationalId || '',
      birthDate,
      gender,
      age: Number(age) || calculateAge(birthDate),
      phone: phone || 'No registrado',
      email: email || '',
      bloodType,
      allergies: allergyList.length > 0 ? allergyList : ['Ninguna'],
      address: address || 'Barrio El Centro',
      emergencyContact: {
        name: 'Contacto Familiar',
        phone: phone || 'No registrado',
        relation: 'Familiar'
      }
    });

    // Reset Form
    setFullName('');
    setNationalId('');
    setPhone('');
    setEmail('');
    setShowAddModal(false);

    // Open WhatsApp Welcome modal for the new patient
    setPatientForWhatsApp(newPat);
    showNotification(`¡Paciente ${newPat.fullName} registrado con éxito!`, 'success');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showNotification(`Código ${code} copiado al portapapeles`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleViewAsPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setRole('paciente');
  };

  return (
    <div className="space-y-5">
      
      {/* 1. TOP HEADER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  Pacientes
                </h1>
                <span className="text-xs font-mono font-bold bg-teal-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  {patients.length} registrados
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de expedientes, registro segmentado por períodos temporales y búsqueda rápida
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="btn-nuevo-paciente"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-teal-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* 2. TIME DIVISION MENU BAR (DÍA / SEMANA / MES / AÑO) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        
        {/* Top Segmented Tabs: Todos, Por Día, Por Semana, Por Mes, Por Año */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            
            {/* TODOS */}
            <button
              id="tab-tiempo-todos"
              onClick={() => setTimeFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Todos los Pacientes</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                timeFilter === 'all' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCounts.all}
              </span>
            </button>

            {/* POR DÍA */}
            <button
              id="tab-tiempo-dia"
              onClick={() => setTimeFilter('day')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === 'day'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Día</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                timeFilter === 'day' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCounts.day}
              </span>
            </button>

            {/* POR SEMANA */}
            <button
              id="tab-tiempo-semana"
              onClick={() => setTimeFilter('week')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === 'week'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Por Semana</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                timeFilter === 'week' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCounts.week}
              </span>
            </button>

            {/* POR MES */}
            <button
              id="tab-tiempo-mes"
              onClick={() => setTimeFilter('month')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === 'month'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Por Mes</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                timeFilter === 'month' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCounts.month}
              </span>
            </button>

            {/* POR AÑO */}
            <button
              id="tab-tiempo-ano"
              onClick={() => setTimeFilter('year')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === 'year'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Por Año</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                timeFilter === 'year' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tabCounts.year}
              </span>
            </button>

          </div>

          {/* Quick Info text */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Período Activo:</span>
            <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              {timeFilter === 'all' && 'Directorio Completo'}
              {timeFilter === 'day' && `Día: ${selectedDate}`}
              {timeFilter === 'week' && `Semana del ${selectedWeekStart}`}
              {timeFilter === 'month' && `${monthsList[selectedMonth].name} ${selectedYear}`}
              {timeFilter === 'year' && `Año ${selectedYear}`}
            </span>
          </div>
        </div>

        {/* Dynamic Contextual Sub-bar for each period mode */}
        {timeFilter === 'day' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Seleccionar Día:</span>
              <button
                onClick={handlePrevDay}
                title="Día anterior"
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                onClick={handleNextDay}
                title="Día siguiente"
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToday}
                className="text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Hoy (31 Ago 2026)
              </button>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-teal-700">{filteredPatients.length}</strong> pacientes de este día
            </div>
          </div>
        )}

        {timeFilter === 'week' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Semana (Inicio):</span>
              <button
                onClick={handlePrevWeek}
                title="Semana anterior"
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedWeekStart}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                onClick={handleNextWeek}
                title="Semana siguiente"
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Esta Semana (25 - 31 Ago)
              </button>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-teal-700">{filteredPatients.length}</strong> pacientes de la semana
            </div>
          </div>
        )}

        {timeFilter === 'month' && (
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Seleccionar Mes del Año {selectedYear}:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Año:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Months Chips */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 pt-1">
              {monthsList.map((m) => {
                const isSelected = selectedMonth === m.id;
                // Count for this specific month
                const countInMonth = patients.filter((p) => {
                  const d = getPatientDate(p);
                  return d.getMonth() === m.id && d.getFullYear() === selectedYear;
                }).length;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMonth(m.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : countInMonth > 0
                        ? 'bg-white hover:bg-teal-50 text-slate-800 border-slate-200'
                        : 'bg-white/50 text-slate-400 border-slate-100 hover:bg-white'
                    }`}
                  >
                    <span className="block">{m.short}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                      {countInMonth}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {timeFilter === 'year' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Seleccionar Año:</span>
              <div className="flex items-center gap-1.5">
                {yearsList.map((y) => {
                  const isSelected = selectedYear === y;
                  const countInYear = patients.filter((p) => getPatientDate(p).getFullYear() === y).length;
                  return (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {y} ({countInYear})
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-teal-700">{filteredPatients.length}</strong> pacientes del año {selectedYear}
            </div>
          </div>
        )}

        {/* 3. SEARCH BAR & DEMOGRAPHIC FILTERS ("y tenga como buscar") */}
        <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-patients"
              type="text"
              placeholder="Buscar por nombre o documento... (Ctrl+F)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Ctrl+F
                </span>
              )}
            </div>
          </div>

          {/* Secondary Filters: Gender, Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Gender filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  genderFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setGenderFilter('M')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  genderFilter === 'M' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Masc (M)
              </button>
              <button
                onClick={() => setGenderFilter('F')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  genderFilter === 'F' ? 'bg-white text-purple-800 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Fem (F)
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="code">Código VAC</option>
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
            </select>

          </div>
        </div>

        {/* Active search indicator */}
        {search && (
          <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200/70 px-3 py-1.5 rounded-xl text-xs text-teal-900">
            <span>
              Resultados para la búsqueda: <strong className="font-bold">"{search}"</strong> ({filteredPatients.length} coincidentes)
            </span>
            <button
              onClick={() => setSearch('')}
              className="text-teal-700 hover:text-teal-900 font-bold underline text-[11px] cursor-pointer"
            >
              Limpiar filtro
            </button>
          </div>
        )}

      </div>

      {/* 4. PATIENT CARDS GRID (MATCHING SCREENSHOT) */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron pacientes</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            No hay registros que coincidan con los filtros temporales o el término de búsqueda seleccionado.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setTimeFilter('all');
                setGenderFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Restablecer Filtros
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Registrar Paciente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const patientReports = reports.filter((r) => r.patientId === patient.id || r.patientName.toLowerCase() === patient.fullName.toLowerCase());
            const patientOrders = orders.filter((o) => {
              if (!o) return false;
              const matchName = o.patientName && o.patientName.toLowerCase().includes(patient.fullName.toLowerCase());
              const matchPhone = o.phone && patient.phone && (o.phone.replace(/\D/g, '') === patient.phone.replace(/\D/g, ''));
              const matchCode = o.patientCode && patient.patientCode && (o.patientCode === patient.patientCode);
              return matchName || matchPhone || matchCode;
            });

            const patientDate = getPatientDate(patient);
            const dateStr = patientDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            return (
              <div
                key={patient.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Top Row: Avatar + Name + Action Icons */}
                  <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors">
                        <User className="w-5 h-5 text-slate-500 group-hover:text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 leading-tight uppercase truncate" title={patient.fullName}>
                          {patient.fullName}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ID: {patient.nationalId ? patient.nationalId : 'no tiene'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Icons in top right */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPatientForWhatsApp(patient)}
                        title="Enviar credenciales o aviso por WhatsApp"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPatientForOrdersHistory(patient)}
                        title="Ver Historial de Órdenes"
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPatientToEdit(patient)}
                        title="Editar Paciente"
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al paciente ${patient.fullName}? Esta acción borrará sus expedientes asociados.`)) {
                            deletePatient(patient.id);
                          }
                        }}
                        title="Eliminar Paciente"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Patient Code Badge Banner */}
                  <div className="mb-3">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          CÓDIGO DE PACIENTE:
                        </span>
                        <span className="font-mono text-xs font-black text-teal-800">
                          {patient.patientCode || 'VAC-000000'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(patient.patientCode || patient.accessCode)}
                        title="Copiar código del paciente"
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {copiedCode === (patient.patientCode || patient.accessCode) ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Demographics & Contact Body matching screenshot */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-white">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800">
                        {patient.age} años, {patient.gender === 'M' ? 'masculino' : patient.gender === 'F' ? 'femenino' : 'otro'}, Nac. {patient.birthDate || '1990-01-01'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{patient.phone ? patient.phone : 'Sin teléfono'}</span>
                    </div>

                    {patient.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Registrado: {dateStr}
                      </span>
                      {patient.bloodType && (
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                          {patient.bloodType}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Bottom Action Button: "Ver Historial de Órdenes" */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={() => setPatientForOrdersHistory(patient)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-800 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:hover:bg-teal-600 group-hover:hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Historial de Órdenes ({patientOrders.length})</span>
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewAsPatient(patient.id)}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Portal Paciente</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setPatientForWhatsApp(patient)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp PIN</span>
                    </button>

                    <button
                      onClick={() => setPatientForHistoryPdf(patient)}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Expediente PDF</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: + NUEVO PACIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Registrar Nuevo Paciente</h3>
                <p className="text-xs text-slate-400">Se asignará automáticamente el código VAC-{String(patients.length + 1).padStart(6, '0')}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ej. MARIO RENE CASTILLO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DNI / Documento de Identidad</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="Dejar vacío si no tiene"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Género</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej. 42940636"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Sanguíneo</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@correo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alergias Conocidas</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="ej. Penicilina, Ninguna"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/30 cursor-pointer"
                >
                  Guardar y Registrar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDITAR PACIENTE */}
      <EditPatientModal
        patient={patientToEdit}
        isOpen={!!patientToEdit}
        onClose={() => setPatientToEdit(null)}
      />

      {/* 7. MODAL: HISTORIAL DE ÓRDENES DEL PACIENTE */}
      <PatientOrderHistoryModal
        patient={patientForOrdersHistory}
        isOpen={!!patientForOrdersHistory}
        onClose={() => setPatientForOrdersHistory(null)}
        onNewOrder={(pat) => {
          setPatientForOrdersHistory(null);
          setStaffActiveTab('nueva-orden');
          showNotification(`Iniciando nueva orden para ${pat.fullName}`, 'info');
        }}
        onOpenPdfReport={(pat) => {
          setPatientForOrdersHistory(null);
          setPatientForHistoryPdf(pat);
        }}
      />

      {/* 8. MODAL: PDF OFICIAL DE HISTORIAL CLÍNICO CONSOLIDADO */}
      <PatientHistoryPdfModal
        patient={patientForHistoryPdf}
        reports={reports}
        isOpen={!!patientForHistoryPdf}
        onClose={() => setPatientForHistoryPdf(null)}
      />

      {/* 9. MODAL: WHATSAPP DE BIENVENIDA Y PIN */}
      {patientForWhatsApp && (
        <WhatsAppMessageModal
          isOpen={!!patientForWhatsApp}
          onClose={() => setPatientForWhatsApp(null)}
          patientName={patientForWhatsApp.fullName}
          patientPhone={patientForWhatsApp.phone}
          patientCode={patientForWhatsApp.patientCode}
          accessCode={patientForWhatsApp.accessCode || patientForWhatsApp.nationalId?.substring(0, 6).toUpperCase()}
          type="bienvenida_paciente"
        />
      )}

    </div>
  );
};
