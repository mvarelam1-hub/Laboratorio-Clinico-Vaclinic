import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  BadgePercent, 
  Plus, 
  Tag, 
  Calendar, 
  Check, 
  Edit, 
  Trash2, 
  Percent, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const PromotionsManagerView: React.FC = () => {
  const { showNotification } = useClinic();

  const [promos, setPromos] = useState([
    {
      id: 'promo-1',
      title: 'Chequeo Preventivo 360 (-20%)',
      code: 'PREV-360',
      discountType: 'percentage',
      discountValue: 20,
      description: 'Incluye Hemograma, Perfil Lipídico, Glucosa, Creatinina y Examen de Orina con 20% de descuento.',
      validUntil: '2026-12-31',
      active: true,
      usesCount: 48
    },
    {
      id: 'promo-2',
      title: 'Perfil Tiroideo 2x1 en Control Semestral',
      code: 'TIROIDEO-2X1',
      discountType: 'bundle',
      discountValue: 50,
      description: 'TSH Ultrasensible y T4 Libre con tarifa preferencial para pacientes en control.',
      validUntil: '2026-10-15',
      active: true,
      usesCount: 32
    }
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('15');
  const [newDescription, setNewDescription] = useState('');

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newP = {
      id: `promo-${Date.now()}`,
      title: newTitle,
      code: newCode.toUpperCase() || `PROMO-${Math.floor(100 + Math.random() * 900)}`,
      discountType: 'percentage',
      discountValue: parseInt(newDiscount) || 10,
      description: newDescription || 'Descuento especial por campaña médica.',
      validUntil: '2026-12-31',
      active: true,
      usesCount: 0
    };

    setPromos([newP, ...promos]);
    setShowNewModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDiscount('15');
    setNewDescription('');
    showNotification('¡Promoción activada con éxito!', 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-black text-slate-900">Promociones y Campañas ({promos.length})</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configura descuentos, convenios empresariales y paquetes de laboratorio aplicables en nueva orden.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Promoción</span>
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promos.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs border border-teal-200">
                    %{p.discountValue}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{p.title}</h3>
                    <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      CÓDIGO: {p.code}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Activa
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Válido hasta: {p.validUntil}</span>
              </div>
              <span className="font-bold text-teal-600 bg-teal-50/70 px-2 py-0.5 rounded">
                {p.usesCount} órdenes aplicadas
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* New Promo Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Nueva Promoción de Laboratorio</h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa los datos del descuento que estará disponible en Nueva Orden.</p>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Promoción *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Chequeo Anual Salud -15%"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Promo</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="SALUD-15"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">% Descuento</label>
                  <input
                    type="number"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles de los exámenes incluidos..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Guardar y Activar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
