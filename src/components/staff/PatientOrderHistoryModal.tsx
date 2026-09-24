import React from 'react';
import { Patient, LabOrder, MedicalReport, LabEpisode } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { 
  FileText, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  Plus, 
  Printer, 
  Download, 
  ExternalLink,
  User,
  Phone,
  Droplet,
  Tag,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface PatientOrderHistoryModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: (patient: Patient) => void;
  onOpenPdfReport: (patient: Patient) => void;
}

export const PatientOrderHistoryModal: React.FC<PatientOrderHistoryModalProps> = ({
  patient,
  isOpen,
  onClose,
  onNewOrder,
  onOpenPdfReport
}) => {
  const { orders, reports, episodes, setActiveReportToEdit, setStaffActiveTab, showNotification } = useClinic();

  if (!isOpen || !patient) return null;

  // Match orders by patient name, phone, nationalId, or patientCode
  const patientOrders = orders.filter((o) => {
    if (!o) return false;
    const matchName = o.patientName && o.patientName.toLowerCase().includes(patient.fullName.toLowerCase());
    const matchPhone = o.phone && patient.phone && (o.phone.replace(/\D/g, '') === patient.phone.replace(/\D/g, ''));
    const matchNationalId = o.nationalId && patient.nationalId && (o.nationalId === patient.nationalId);
    const matchCode = o.patientCode && patient.patientCode && (o.patientCode === patient.patientCode);
    return matchName || matchPhone || matchNationalId || matchCode;
  });

  const patientReports = reports.filter((r) => r.patientId === patient.id || r.patientName.toLowerCase() === patient.fullName.toLowerCase());
  const patientEpisodes = episodes.filter((e) => e.patientId === patient.id || e.patientName.toLowerCase() === patient.fullName.toLowerCase());

  const totalSpent = patientOrders.reduce((acc, curr) => {
    const val = parseFloat(curr.totalPrice.replace(/[^0-9.]/g, '')) || 0;
    return acc + val;
  }, 0);

  const handlePrintOrder = (order: LabOrder) => {
    showNotification(`Generando comprobante de orden ${order.orderNumber} para impresión...`, 'info');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Historial de Órdenes y Estudios</h3>
                <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  {patient.patientCode || 'PACIENTE'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {patient.fullName} • {patient.age} años • DNI: {patient.nationalId || 'No registrado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Patient Summary Quick Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Teléfono</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Phone className="w-3 h-3 text-teal-600" /> {patient.phone || 'No registrado'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Grupo Sanguíneo</span>
            <span className="font-semibold text-rose-700 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-rose-500" /> {patient.bloodType || 'O+'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total de Órdenes</span>
            <span className="font-bold text-slate-900">{patientOrders.length} órdenes registradas</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto Acumulado</span>
            <span className="font-bold text-teal-700 font-mono">Q{totalSpent.toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Body: Scrollable list of orders */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Expedientes y Órdenes Clínicas ({patientOrders.length})
            </h4>
            <button
              onClick={() => {
                onClose();
                onNewOrder(patient);
              }}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Orden para este Paciente</span>
            </button>
          </div>

          {patientOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h5 className="text-sm font-bold text-slate-700">Sin órdenes generadas aún</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Este paciente está registrado en la base de datos pero aún no tiene órdenes de laboratorio asociadas.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewOrder(patient);
                }}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generar Primera Orden de Laboratorio</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patientOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                        {order.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.date}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Listo' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'En Proceso'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status}
                      </span>

                      <span className="text-xs font-mono font-black text-slate-900">
                        {order.totalPrice}
                      </span>
                    </div>
                  </div>

                  {/* Test List Tags */}
                  <div className="pt-2.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      Exámenes cargados ({order.testsCount} pruebas):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {order.testsList.map((test, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/60"
                        >
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Sede: {order.branchId ? order.branchId.toUpperCase() : 'CENTRAL'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Comprobante</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medical Reports Section */}
          {patientReports.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Informes Médicos Validados ({patientReports.length})
              </h4>
              <div className="space-y-2">
                {patientReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between bg-teal-50/60 border border-teal-100 rounded-xl p-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-teal-900 block">{rep.reportNumber} - {rep.title}</span>
                      <span className="text-[11px] text-slate-500">
                        Emitido: {new Date(rep.emissionDate).toLocaleDateString()} • {rep.parameters.length} parámetros analizados
                      </span>
                    </div>
                    <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                      {rep.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => onOpenPdfReport(patient)}
            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span>Descargar Historial Clínico PDF</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
