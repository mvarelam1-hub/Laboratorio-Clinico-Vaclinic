import React, { useRef } from 'react';
import { 
  LabSettings, 
  HeaderMode, 
  LogoPosition, 
  WatermarkType, 
  WatermarkPosition, 
  FooterMode 
} from '../../../types/labSettings';
import { 
  Building2, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  FileText, 
  Check, 
  Info, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  Layers,
  Stamp,
  PenTool,
  Sliders,
  Eye,
  Move,
  FileCheck,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface LetterheadSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

export const LetterheadSettingsTab: React.FC<LetterheadSettingsTabProps> = ({
  settings,
  onChange
}) => {
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const watermarkFileInputRef = useRef<HTMLInputElement>(null);
  const footerBannerFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            logoUrl: event.target.result as string,
            logoType: 'custom_image'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            bannerImageUrl: event.target.result as string,
            headerMode: 'full_banner_image'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            watermarkImageUrl: event.target.result as string,
            watermarkType: 'custom_image'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFooterBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            footerBannerUrl: event.target.result as string,
            footerMode: 'full_banner_image'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            officialSignatureUrl: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            officialStampUrl: event.target.result as string,
            showOfficialStamp: true
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 0. Plantilla Visual Oficial VACLINIC */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#082133]" />
              Plantilla Visual Oficial VACLINIC para Impresión y PDF
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura el diseño gráfico de emisión de los informes clínicos y archivos PDF descargables del laboratorio VACLINIC.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-50 text-[#082133] border border-cyan-200">
            {settings.reportTemplateStyle === 'vaclinic' ? 'VACLINIC Oficial Activo' : 'Formato Compacto Activo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Option 1: VACLINIC Official */}
          <button
            type="button"
            onClick={() => onChange({ reportTemplateStyle: 'vaclinic' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.reportTemplateStyle === 'vaclinic' || !settings.reportTemplateStyle
                ? 'border-[#082133] bg-sky-50/40 shadow-xs ring-2 ring-[#082133]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#082133] text-white flex items-center justify-center font-bold text-xs">
                    V
                  </div>
                  <span className="font-black text-xs text-slate-900">Formato Oficial VACLINIC</span>
                </div>
                {(settings.reportTemplateStyle === 'vaclinic' || !settings.reportTemplateStyle) && (
                  <Check className="w-4 h-4 text-[#082133] font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Diseño oficial de referencia: membrete con isotipo y bloque azul marino superior, ficha delimitada para paciente y orden médica, tarjetas por perfil con encabezado azul celeste, nota médica y agradecimiento, 4 columnas de firmas con sello digital y código QR, y pie institucional.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#082133] uppercase tracking-wider bg-sky-100 px-2 py-0.5 rounded">
                Diseño Oficial
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Recomendado</span>
            </div>
          </button>

          {/* Option 2: VACLINIC Compact */}
          <button
            type="button"
            onClick={() => onChange({ reportTemplateStyle: 'compact' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.reportTemplateStyle === 'compact'
                ? 'border-cyan-600 bg-cyan-50/50 shadow-xs ring-2 ring-cyan-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <span className="font-black text-xs text-slate-900">Formato Compacto VACLINIC</span>
                </div>
                {settings.reportTemplateStyle === 'compact' && (
                  <Check className="w-4 h-4 text-cyan-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Diseño condensado con márgenes ajustados y tabla de resultados compacta, ideal para análisis de 1 a 6 parámetros en una sola página.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                Económico / 1 Hoja
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Ahorro de papel</span>
            </div>
          </button>
        </div>

        {/* Default Company Name Input */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-0.5">
              Empresa / Convenio Institucional por defecto:
            </label>
            <span className="text-[11px] text-slate-500 block">
              Se mostrará en la sección de datos del paciente (ej: MUNICIPALIDAD FC, SEGUROS G&T, etc.)
            </span>
          </div>
          <input
            type="text"
            value={settings.companyName || ''}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="MUNICIPALIDAD FC"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:bg-white focus:border-[#0070ba]"
          />
        </div>
      </div>

      {/* Header Mode Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Modalidad del Membrete en Hoja de Resultados
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elige cómo debe imprimirse o generarse el encabezado oficial en cada informe PDF o físico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Option 1: Standard Logo + Text */}
          <button
            type="button"
            onClick={() => onChange({ headerMode: 'standard_text_logo' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.headerMode === 'standard_text_logo'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Logo + Texto Institucional</span>
                {settings.headerMode === 'standard_text_logo' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Imprime el logotipo digital junto con el nombre del laboratorio, datos de contacto, dirección y acreditaciones sanitarias.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-teal-700 uppercase tracking-wider">Recomendado</span>
          </button>

          {/* Option 2: Full Graphic Banner Image */}
          <button
            type="button"
            onClick={() => onChange({ headerMode: 'full_banner_image' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.headerMode === 'full_banner_image'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Imagen de Membrete Completa</span>
                {settings.headerMode === 'full_banner_image' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Utiliza un banner gráfico prediseñado por tu diseñador (PNG/JPG en alta resolución) para toda la cabecera del informe.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Banner Gráfico</span>
          </button>

          {/* Option 3: Preprinted Stationery */}
          <button
            type="button"
            onClick={() => onChange({ headerMode: 'preprinted_stationery' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.headerMode === 'preprinted_stationery'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Papel Membretado Físico</span>
                {settings.headerMode === 'preprinted_stationery' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Oculta la cabecera digital e incrementa el margen superior para imprimir directamente sobre hojas membretadas de imprenta.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Ahorro de Tinta</span>
          </button>
        </div>

        {settings.headerMode === 'preprinted_stationery' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Margen superior libre reservado para el membrete físico de imprenta:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={20}
                max={90}
                value={settings.preprintedTopMarginMm}
                onChange={(e) => onChange({ preprintedTopMarginMm: Number(e.target.value) })}
                className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-center font-bold text-xs"
              />
              <span className="font-mono text-xs font-bold text-amber-800">mm</span>
            </div>
          </div>
        )}
      </div>

      {/* Logotype & Banner Upload Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-teal-600" />
          Logotipo Institucional e Imagen de Membrete
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Logo Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Logotipo del Laboratorio</label>
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ logoUrl: '', logoType: 'default_vaclinic' })}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar logo personalizado</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-1 relative overflow-hidden shadow-xs">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-black shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                  >
                    <span className="text-lg leading-none">VC</span>
                    <span className="text-[7px] font-mono tracking-widest font-bold mt-0.5">LAB</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>Subir Imagen de Logo (PNG/JPG)</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  Formato recomendado: PNG transparente o SVG de 300 DPI.
                </p>
              </div>
            </div>

            {/* Logo Dimensions & Alignment */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Tamaño Logo: <span className="font-mono text-teal-700 font-bold">{settings.logoWidthPx}px</span>
                </label>
                <input
                  type="range"
                  min={40}
                  max={130}
                  step={2}
                  value={settings.logoWidthPx}
                  onChange={(e) => onChange({ logoWidthPx: Number(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Posición del Logo
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['left', 'center', 'right'] as LogoPosition[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => onChange({ logoPosition: pos })}
                      className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                        settings.logoPosition === pos
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pos === 'left' ? 'Izq' : pos === 'center' ? 'Centro' : 'Der'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Full Banner Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Banner Completo de Membrete</label>
              {settings.bannerImageUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ bannerImageUrl: '' })}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar banner</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={bannerFileInputRef}
                onChange={handleBannerUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              
              {settings.bannerImageUrl ? (
                <div className="border border-slate-300 rounded-xl p-2 bg-white relative group overflow-hidden">
                  <img 
                    src={settings.bannerImageUrl} 
                    alt="Banner de membrete" 
                    className="w-full h-16 object-contain rounded"
                  />
                  <div className="text-[10px] text-center text-teal-700 font-bold mt-1">
                    Banner Activo • Altura: {settings.bannerHeightMm}mm
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-white hover:bg-teal-50/30 hover:border-teal-400 transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">Cargar Banner Completo</span>
                  <span className="text-[10px] text-slate-400 block">PNG/JPG (ej. 2480 x 400 px)</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Altura de cabecera:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={20}
                    max={60}
                    value={settings.bannerHeightMm}
                    onChange={(e) => onChange({ bannerHeightMm: Number(e.target.value) })}
                    className="w-14 px-2 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-bold font-mono"
                  />
                  <span className="text-[10px] font-bold text-slate-500 font-mono">mm</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. MARCA DE AGUA & PARÁMETROS DE SEGURIDAD                                */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Marca de Agua e Identidad de Seguridad
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Controla la transparencia, ubicación y tipo de marca de agua en los informes para garantizar autenticidad y legibilidad.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Opacidad: {Math.round((settings.watermarkOpacity ?? 0.05) * 100)}%
            </span>
          </div>
        </div>

        {/* Watermark Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'none', label: 'Sin Marca de Agua', desc: 'Fondo blanco limpio' },
            { id: 'custom_image', label: 'Imagen / Logo Subido', desc: 'PNG o escudo del lab' },
            { id: 'preset_text', label: 'Texto Predefinido', desc: 'ORIGINAL, COPIA, etc.' },
            { id: 'custom_text', label: 'Texto Personalizado', desc: 'Nombre o frase propia' }
          ].map((type) => {
            const isSelected = (settings.watermarkType || (settings.watermarkImageUrl ? 'custom_image' : (settings.watermarkPreset !== 'none' ? 'preset_text' : 'none'))) === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  if (type.id === 'none') {
                    onChange({ watermarkType: 'none', watermarkPreset: 'none' });
                  } else if (type.id === 'preset_text') {
                    onChange({ 
                      watermarkType: 'preset_text', 
                      watermarkPreset: settings.watermarkPreset === 'none' ? 'ORIGINAL' : settings.watermarkPreset 
                    });
                  } else if (type.id === 'custom_text') {
                    onChange({ 
                      watermarkType: 'custom_text',
                      customWatermarkText: settings.customWatermarkText || settings.labName || 'CONFIDENCIAL'
                    });
                  } else if (type.id === 'custom_image') {
                    onChange({ watermarkType: 'custom_image' });
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 text-slate-900'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{type.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">{type.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Conditional Controls by Watermark Type */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          
          {/* Custom Image Upload */}
          {(settings.watermarkType === 'custom_image' || (!settings.watermarkType && settings.watermarkImageUrl)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  Imagen de Marca de Agua (PNG Transparente / SVG / JPG)
                </label>
                {settings.watermarkImageUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ watermarkImageUrl: '', watermarkType: 'none' })}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar imagen</span>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={watermarkFileInputRef}
                onChange={handleWatermarkUpload}
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                className="hidden"
              />

              {settings.watermarkImageUrl ? (
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1 relative overflow-hidden">
                    <img 
                      src={settings.watermarkImageUrl} 
                      alt="Marca de agua" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Imagen cargada correctamente</span>
                    <p className="text-[11px] text-slate-500">
                      Se aplicará de fondo con la opacidad, escala y posición configuradas abajo.
                    </p>
                    <button
                      type="button"
                      onClick={() => watermarkFileInputRef.current?.click()}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                    >
                      Reemplazar imagen...
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => watermarkFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white hover:bg-teal-50/30 hover:border-teal-400 transition-all cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 block">Subir Imagen de Marca de Agua</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">PNG transparente con logotipo institucional o isotipo</span>
                </div>
              )}
            </div>
          )}

          {/* Preset Text Selector */}
          {settings.watermarkType === 'preset_text' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase block">
                Selecciona el Texto Predefinido de Seguridad:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['ORIGINAL', 'COPIA', 'CONFIDENCIAL', 'VALIDADO', 'MUESTRA'].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => onChange({ watermarkPreset: txt })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-black uppercase transition-all cursor-pointer text-center ${
                      settings.watermarkPreset === txt
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Text Input */}
          {settings.watermarkType === 'custom_text' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase block">
                Texto Personalizado para la Marca de Agua:
              </label>
              <input
                type="text"
                value={settings.customWatermarkText || ''}
                onChange={(e) => onChange({ customWatermarkText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase bg-white focus:ring-2 focus:ring-teal-500/20 outline-hidden tracking-wider"
                placeholder="EJ. COPIA CONTROLADA - DR. BARRIENTOS"
              />
            </div>
          )}

          {/* Opacity, Position, and Scale Grid */}
          <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Control 1: Opacity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  Opacidad de Marca:
                </label>
                <span className="text-xs font-mono font-black text-teal-700">
                  {Math.round((settings.watermarkOpacity ?? 0.05) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={Math.round((settings.watermarkOpacity ?? 0.05) * 100)}
                onChange={(e) => onChange({ watermarkOpacity: Number(e.target.value) / 100 })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>1% (Muy tenue)</span>
                <span className="text-teal-600 font-bold">Recomendado: 4-8%</span>
                <span>50% (Marcado)</span>
              </div>
            </div>

            {/* Control 2: Position Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-teal-600" />
                Posición en la Hoja:
              </label>
              <select
                value={settings.watermarkPosition || 'diagonal_center'}
                onChange={(e) => onChange({ watermarkPosition: e.target.value as WatermarkPosition })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500/20 outline-hidden cursor-pointer"
              >
                <option value="diagonal_center">Diagonal 45° (Centro Inclinado)</option>
                <option value="center">Centro Horizontal</option>
                <option value="top">Superior (Debajo de cabecera)</option>
                <option value="bottom">Inferior (Encima de pie de página)</option>
                <option value="repeat">Mosaico / Repetida Tiled</option>
              </select>
              <span className="text-[10px] text-slate-500 block">
                {settings.watermarkPosition === 'repeat' ? 'Multiples repeticiones por toda la hoja' : 'Centrada en el eje vertical/horizontal'}
              </span>
            </div>

            {/* Control 3: Scale Percent Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Escala / Tamaño:
                </label>
                <span className="text-xs font-mono font-black text-teal-700">
                  {settings.watermarkScalePercent ?? 80}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={150}
                step={5}
                value={settings.watermarkScalePercent ?? 80}
                onChange={(e) => onChange({ watermarkScalePercent: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>40% (Discreto)</span>
                <span>100% (Estándar)</span>
                <span>150% (Grande)</span>
              </div>
            </div>

          </div>

          {/* Legibility Live Simulation Preview */}
          <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Simulación de Legibilidad de Resultados:</div>
            <div className="relative py-2 px-3 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-[11px] overflow-hidden">
              {/* Simulated watermark layer */}
              <div 
                className={`absolute inset-0 pointer-events-none flex items-center justify-center select-none font-black text-slate-900 ${
                  settings.watermarkPosition === 'diagonal_center' ? 'transform -rotate-12' : ''
                }`}
                style={{ opacity: settings.watermarkOpacity ?? 0.05 }}
              >
                {settings.watermarkImageUrl ? (
                  <img src={settings.watermarkImageUrl} alt="wm" className="h-10 object-contain" />
                ) : (
                  <span className="text-2xl uppercase tracking-widest border-2 border-slate-900 px-3 py-0.5 rounded">
                    {settings.watermarkType === 'custom_text' ? (settings.customWatermarkText || 'CONFIDENCIAL') : (settings.watermarkPreset !== 'none' ? settings.watermarkPreset : 'MEDILAB')}
                  </span>
                )}
              </div>
              {/* Simulated foreground text */}
              <div className="relative z-10 font-medium text-slate-800">
                Glucosa en Ayunas: <strong className="font-mono text-slate-950 font-bold">92.0 mg/dL</strong>
              </div>
              <div className="relative z-10 text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                NORMAL (70 - 100)
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PIE DE PÁGINA (FOOTER) INSTITUCIONAL                                    */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Pie de Página (Footer) e Identidad Inferior
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza el formato de cierre del informe, acreditaciones de calidad o banner gráfico inferior.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {settings.footerMode === 'full_banner_image' ? 'Banner Gráfico' : settings.footerMode === 'minimal' ? 'Minimalista' : 'Corporativo Estándar'}
          </span>
        </div>

        {/* Footer Mode Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onChange({ footerMode: 'standard' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              (settings.footerMode || 'standard') === 'standard'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Columnas Corporativas</span>
                {(settings.footerMode || 'standard') === 'standard' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dirección con pin geográfico, lema del laboratorio, certificación ISO 15189 y numeración de página.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-teal-700 uppercase tracking-wider">Oficial VACLINIC</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ footerMode: 'full_banner_image' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.footerMode === 'full_banner_image'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Banner Gráfico Inferior</span>
                {settings.footerMode === 'full_banner_image' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Utiliza una tira gráfica prediseñada con logotipos de aseguradoras, certificaciones o redes sociales.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Diseño a Medida</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ footerMode: 'minimal' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.footerMode === 'minimal'
                ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs text-slate-900">Minimalista</span>
                {settings.footerMode === 'minimal' && (
                  <Check className="w-4 h-4 text-teal-600 font-bold" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Línea sutil de división con numeración de página y aviso legal de confidencialidad en texto compacto.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ahorro de Espacio</span>
          </button>
        </div>

        {/* Footer Banner Upload if full_banner_image */}
        {settings.footerMode === 'full_banner_image' && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Banner de Pie de Página (PNG / JPG)</label>
              {settings.footerBannerUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ footerBannerUrl: '', footerMode: 'standard' })}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar banner inferior</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={footerBannerFileInputRef}
              onChange={handleFooterBannerUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {settings.footerBannerUrl ? (
              <div className="border border-slate-300 rounded-xl p-2 bg-white relative group overflow-hidden">
                <img 
                  src={settings.footerBannerUrl} 
                  alt="Banner inferior" 
                  className="w-full h-14 object-contain rounded"
                />
                <div className="text-[10px] text-center text-teal-700 font-bold mt-1">
                  Banner Inferior Activo • Altura: {settings.footerBannerHeightMm || 24}mm
                </div>
              </div>
            ) : (
              <div 
                onClick={() => footerBannerFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-white hover:bg-teal-50/30 hover:border-teal-400 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-700 block">Cargar Banner Inferior</span>
                <span className="text-[10px] text-slate-400 block">PNG/JPG (ej. 2480 x 250 px)</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Altura máxima del banner inferior:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={15}
                  max={50}
                  value={settings.footerBannerHeightMm || 24}
                  onChange={(e) => onChange({ footerBannerHeightMm: Number(e.target.value) })}
                  className="w-14 px-2 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-bold font-mono"
                />
                <span className="text-[10px] font-bold text-slate-500 font-mono">mm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FIRMA DIGITALIZADA Y SELLO OFICIAL                                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-teal-600" />
            Firma Digitalizada y Sello Oficial del Laboratorio
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sube el trazo manuscrito escaneado del profesional responsable y el sello institucional para impresión automática.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Handwritten Signature */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-teal-600" />
                Firma Digitalizada del Bioanalista
              </label>
              {settings.officialSignatureUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ officialSignatureUrl: '' })}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar firma</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={signatureFileInputRef}
              onChange={handleSignatureUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {/* Signature Preview or Upload Box */}
            <div className="border border-slate-300 rounded-xl p-3 bg-white min-h-[90px] flex flex-col items-center justify-center relative">
              {settings.officialSignatureUrl ? (
                <div className="w-full flex flex-col items-center">
                  <img 
                    src={settings.officialSignatureUrl} 
                    alt="Firma Digitalizada" 
                    className="h-16 max-w-full object-contain filter contrast-125"
                  />
                  <div className="w-36 h-[1px] bg-slate-900 mt-1"></div>
                  <span className="text-[9px] font-mono font-bold text-teal-700 mt-1">Firma Manuscrita Registrada</span>
                </div>
              ) : (
                <div 
                  onClick={() => signatureFileInputRef.current?.click()}
                  className="text-center cursor-pointer p-2 w-full hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">Subir Trazo de Firma (PNG)</span>
                  <span className="text-[10px] text-slate-400 block">Fondo transparente para nitidez sobre papel</span>
                </div>
              )}
            </div>

            {/* Signer Bioanalyst Details */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nombre Completo del Responsable</label>
                <input
                  type="text"
                  value={settings.officialSignerName || ''}
                  onChange={(e) => onChange({ officialSignerName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                  placeholder="Licda. Claudia Barrientos"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cargo Profesional</label>
                  <input
                    type="text"
                    value={settings.officialSignerRole || ''}
                    onChange={(e) => onChange({ officialSignerRole: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                    placeholder="Química Bióloga"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Colegiado / Licencia</label>
                  <input
                    type="text"
                    value={settings.officialSignerLicense || ''}
                    onChange={(e) => onChange({ officialSignerLicense: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
                    placeholder="Col. #3884 - MSPAS"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Card 2: Official Stamp */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-teal-600" />
                Sello Oficial de Laboratorio
              </label>
              {settings.officialStampUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ officialStampUrl: '', showOfficialStamp: false })}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar sello</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={stampFileInputRef}
              onChange={handleStampUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {/* Stamp Preview or Upload Box */}
            <div className="border border-slate-300 rounded-xl p-3 bg-white min-h-[90px] flex items-center justify-center relative overflow-hidden">
              {settings.officialStampUrl ? (
                <div className="flex items-center gap-4 w-full">
                  <div 
                    className="rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center p-1 relative flex-shrink-0"
                    style={{ 
                      width: `${settings.officialStampSizePx || 80}px`, 
                      height: `${settings.officialStampSizePx || 80}px`,
                      opacity: settings.officialStampOpacity ?? 0.88
                    }}
                  >
                    <img 
                      src={settings.officialStampUrl} 
                      alt="Sello Oficial" 
                      className="w-full h-full object-contain filter contrast-125 rotate-6"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Sello Oficial Cargado</span>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={settings.showOfficialStamp ?? true}
                        onChange={(e) => onChange({ showOfficialStamp: e.target.checked })}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">Imprimir sello en informes</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => stampFileInputRef.current?.click()}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 underline block cursor-pointer"
                    >
                      Reemplazar sello...
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => stampFileInputRef.current?.click()}
                  className="text-center cursor-pointer p-2 w-full hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">Subir Sello de Hule / Circular (PNG)</span>
                  <span className="text-[10px] text-slate-400 block">Sello digital con tinta azul/negra sin fondo</span>
                </div>
              )}
            </div>

            {/* Stamp Adjustments */}
            {settings.officialStampUrl && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Tamaño:</label>
                    <span className="text-[10px] font-mono font-bold text-teal-700">{settings.officialStampSizePx || 80}px</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={130}
                    step={2}
                    value={settings.officialStampSizePx || 80}
                    onChange={(e) => onChange({ officialStampSizePx: Number(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Opacidad de Tinta:</label>
                    <span className="text-[10px] font-mono font-bold text-teal-700">{Math.round((settings.officialStampOpacity ?? 0.88) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    step={5}
                    value={Math.round((settings.officialStampOpacity ?? 0.88) * 100)}
                    onChange={(e) => onChange({ officialStampOpacity: Number(e.target.value) / 100 })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-600" />
          Datos Institucionales & Registros Sanitarios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre Comercial del Laboratorio</label>
            <input
              type="text"
              value={settings.labName}
              onChange={(e) => onChange({ labName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="VACLINIC - Laboratorio Clínico y Especialidades"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Razón Social Legal (Facturación / Auditoría)</label>
            <input
              type="text"
              value={settings.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="Diagnósticos Médicos Integrales S.A."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Lema o Slogan Institucional</label>
            <input
              type="text"
              value={settings.slogan}
              onChange={(e) => onChange({ slogan: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden italic"
              placeholder="Precisión que diagnostica, confianza que cuida"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Identificación Tributaria (NIT / RUC)</label>
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => onChange({ taxId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="NIT: 8492019-4"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Licencia Sanitaria / Registro MSPAS</label>
            <input
              type="text"
              value={settings.sanitaryLicense}
              onChange={(e) => onChange({ sanitaryLicense: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="Lic. Sanitaria MSPAS-DRACES #8841-2024"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Acreditación de Calidad ISO / CAP</label>
            <input
              type="text"
              value={settings.isoAccreditation}
              onChange={(e) => onChange({ isoAccreditation: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="Acreditado bajo norma ISO 15189:2022"
            />
          </div>
        </div>

        {/* Location & Contact Information */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Dirección Principal</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="Entrada de Pineda Oratorio Santa Rosa km 79.5"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Municipio / Departamento / País</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="Oratorio, Santa Rosa, Guatemala"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Teléfono Principal / WhatsApp</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => onChange({ phone: e.target.value, whatsappNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="56125563"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Teléfono Secundario / PBX</label>
            <input
              type="text"
              value={settings.phoneSecondary || ''}
              onChange={(e) => onChange({ phoneSecondary: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="PBX: 2300-1122"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Correo Electrónico de Resultados</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="resultados@vaclinic.laboratorio.gt"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Especialidades Listadas en Encabezado</label>
          <input
            type="text"
            value={settings.specialtiesList}
            onChange={(e) => onChange({ specialtiesList: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
            placeholder="Hematología • Bioquímica • Inmunología • Microbiología • Hormonas • Urianálisis"
          />
        </div>

      </div>

    </div>
  );
};
