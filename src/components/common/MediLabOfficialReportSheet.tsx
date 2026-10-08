import React from 'react';
import { MedicalReport } from '../../types';
import { LabSettings } from '../../types/labSettings';
import { VaclinicOfficialReportSheet } from './VaclinicOfficialReportSheet';

export interface MediLabOfficialReportSheetProps {
  report: MedicalReport;
  watermark?: string;
  includeSignatures?: boolean;
  scale?: number;
  printMode?: boolean;
  id?: string;
  customOrderNumber?: string;
  customCompany?: string;
  customVerifierName?: string;
  customVerificationDate?: string;
  customSettings?: LabSettings;
}

export const MediLabOfficialReportSheet: React.FC<MediLabOfficialReportSheetProps> = ({
  report,
  watermark = 'none',
  includeSignatures = true,
  scale = 1,
  printMode = false,
  id = 'vaclinic-official-report-sheet',
  customSettings
}) => {
  return (
    <VaclinicOfficialReportSheet
      report={report}
      watermark={watermark}
      includeSignatures={includeSignatures}
      scale={scale}
      printMode={printMode}
      id={id}
      customSettings={customSettings}
    />
  );
};
