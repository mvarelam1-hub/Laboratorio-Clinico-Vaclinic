import React from 'react';
import { LabSettings } from '../../../types/labSettings';
import { MedicalReport } from '../../../types';
import { VaclinicOfficialReportSheet } from '../../common/VaclinicOfficialReportSheet';

interface LiveReportPreviewSheetProps {
  settings: LabSettings;
  scale?: number;
}

const SAMPLE_VACLINIC_REPORT: MedicalReport = {
  id: 'sample-vaclinic-preview',
  reportNumber: '131-2026',
  patientId: 'VAC-000026',
  patientName: 'PACIENTE EJEMPLO',
  patientAge: 39,
  patientGender: 'F',
  patientNationalId: '41928301',
  referringDoctor: 'PARTICULAR',
  company: 'PARTICULAR',
  sampleDate: '2026-08-18T09:58:57',
  emissionDate: '2026-08-18T11:06:18',
  laboratoryName: 'VACLINIC',
  category: 'laboratorio',
  title: 'Examen general de laboratorio - Oficial',
  status: 'publicado',
  clinicalFindings: '',
  doctorConclusions: '',
  patientExplanation: '',
  recommendations: [],
  qrVerificationCode: 'QR-131-2026',
  parameters: [
    { id: '1', name: 'Glucosa en Ayunas', value: '92', unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal' },
    { id: '2', name: 'Colesterol Total', value: '185', unit: 'mg/dL', referenceRange: '< 200', status: 'normal' },
    { id: '3', name: 'Triglicéridos', value: '142', unit: 'mg/dL', referenceRange: '< 150', status: 'normal' },
    { id: '4', name: 'TSH Ultrasensible', value: '2.4', unit: 'uUI/mL', referenceRange: '0.4 - 4.2', status: 'normal' },
    { id: '5', name: 'Leucocitos', value: '7,500', unit: '/mm³', referenceRange: '4,500 - 11,000', status: 'normal' },
    { id: '6', name: 'Hemoglobina', value: '14.2', unit: 'g/dL', referenceRange: '12.0 - 16.0', status: 'normal' }
  ]
};

export const LiveReportPreviewSheet: React.FC<LiveReportPreviewSheetProps> = ({
  settings
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      <VaclinicOfficialReportSheet
        report={SAMPLE_VACLINIC_REPORT}
        watermark={settings.watermarkPreset === 'none' ? 'none' : settings.watermarkPreset}
        customSettings={settings}
      />
    </div>
  );
};
