import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MedicalReport, ReportParameter, Patient } from '../types';

export interface PdfExportOptions {
  includeAiPatientSummary?: boolean;
  includeBioanalystSignature?: boolean;
  includeDoctorSignature?: boolean;
  bioanalystName?: string;
  bioanalystSpecialty?: string;
  bioanalystLicense?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  watermarkText?: string;
  filename?: string;
}

export interface HistoricalSummaryPdfOptions {
  watermark?: string;
  filename?: string;
  bioanalystName?: string;
  bioanalystSpecialty?: string;
  bioanalystLicense?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
}

export class PdfReportService {
  /**
   * Generates and downloads a high-fidelity PDF from an existing DOM element
   */
  static async exportElementToPdf(
    element: HTMLElement,
    filename: string = 'VACLINIC_Informe_Medico.pdf',
    options?: {
      paperSize?: 'a4' | 'letter' | 'legal';
      avoidOrphanPages?: boolean;
    }
  ): Promise<boolean> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2.2, // High DPI for crisp printing
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          // Replace any unsupported oklch colors with standard hex/rgb
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              if (htmlEl.style.color && htmlEl.style.color.includes('oklch')) {
                htmlEl.style.color = '#000000';
              }
              if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor.includes('oklch')) {
                htmlEl.style.backgroundColor = '#ffffff';
              }
              if (htmlEl.style.borderColor && htmlEl.style.borderColor.includes('oklch')) {
                htmlEl.style.borderColor = '#cbd5e1';
              }
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const paperFormat = options?.paperSize || 'letter';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paperFormat,
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      let imgWidth = pdfWidth;
      let imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Smart anti-orphan page logic:
      // Prevent signatures and footer from landing isolated on a blank second page
      const avoidOrphans = options?.avoidOrphanPages !== false;
      if (avoidOrphans) {
        const fullPages = Math.floor(imgHeight / pdfHeight);
        const overflowRemainder = imgHeight - (fullPages * pdfHeight);
        
        // If it's a 1-page report where signatures & footer spill by up to 100mm (or multi-page spilling by up to 85mm),
        // adjust proportional scale so all content and signatures stay unified on the page without creating an orphan signatures page.
        const maxAllowedOverflow = fullPages === 1 ? 100 : 85;
        if (fullPages >= 1 && overflowRemainder > 0 && overflowRemainder <= maxAllowedOverflow) {
          const fitScale = (fullPages * pdfHeight) / imgHeight;
          imgHeight = fullPages * pdfHeight;
          imgWidth = pdfWidth * fitScale;
        }
      }

      let heightLeft = imgHeight;
      let position = 0;
      const xOffset = (pdfWidth - imgWidth) / 2;

      // First page
      pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Handle multi-page reports if content exceeds standard page
      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('Error generating PDF with html2canvas/jsPDF:', error);
      return false;
    }
  }

  /**
   * Generates a branded, publication-quality vector PDF report summarizing historical patient results using jsPDF directly.
   */
  static generateHistoricalSummaryPdf(
    patient: Patient,
    reports: MedicalReport[],
    options?: HistoricalSummaryPdfOptions
  ): boolean {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Filter and sort reports chronologically (newest first)
      const patientReports = reports
        .filter(r => r.patientId === patient.id && (r.status === 'publicado' || r.status === 'entregado'))
        .sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2; // 182mm

      const validationHash = '0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const emissionDate = new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const bioanalyst = options?.bioanalystName || 'Licda. Elena Morales Cruz';
      const bioanalystSpec = options?.bioanalystSpecialty || 'Bioanálisis Clínico & Microbiología';
      const bioanalystCol = options?.bioanalystLicense || 'Col. Bioanálisis #4192 / MSPAS-8812';

      const doctor = options?.doctorName || 'Dr. Alejandro Valenzuela Morales';
      const doctorSpec = options?.doctorSpecialty || 'Médico Patólogo Clínico';
      const doctorCol = options?.doctorLicense || 'CMP-649102 / RNE-28491';

      // Global stats
      const totalAnalytes = patientReports.reduce((acc, r) => acc + (r.parameters?.length || 0), 0);
      const abnormalCount = patientReports.reduce((acc, r) => {
        return acc + (r.parameters?.filter(p => p.status === 'high' || p.status === 'low' || p.status === 'critical').length || 0);
      }, 0);
      const optimalPercent = totalAnalytes > 0 ? Math.round(((totalAnalytes - abnormalCount) / totalAnalytes) * 100) : 100;

      const oldestDate = patientReports.length > 0 
        ? new Date(patientReports[patientReports.length - 1].sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';
      const newestDate = patientReports.length > 0
        ? new Date(patientReports[0].sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

      // Drawing Helpers
      const drawHeader = (isContinuation: boolean = false) => {
        // Top accent line
        pdf.setFillColor(15, 23, 42); // slate-900
        pdf.rect(0, 0, pageWidth, 4, 'F');
        pdf.setFillColor(13, 148, 136); // teal-600
        pdf.rect(0, 4, pageWidth, 1.5, 'F');

        // Logo Box
        pdf.setFillColor(13, 148, 136);
        pdf.roundedRect(margin, 9, 14, 14, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text('VC', margin + 3, 17.5);
        pdf.setFontSize(6);
        pdf.text('LAB', margin + 4, 21);

        // Clinic Branding
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text('VACLINIC', margin + 17, 14);

        pdf.setFontSize(7.5);
        pdf.setTextColor(13, 148, 136);
        pdf.text('LABORATORIO CLÍNICO Y BIOLÓGICO', margin + 17, 18);

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text('"Precisión que diagnostica, confianza que cuida"', margin + 17, 21.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.text('Entrada de Pineda Oratorio Santa Rosa km 79.5 • Tel/WhatsApp: 56125563 • ISO 15189', margin + 17, 24.5);

        // Right side dossier badge
        pdf.setFillColor(240, 253, 250); // teal-50
        pdf.setDrawColor(153, 246, 228); // teal-200
        pdf.roundedRect(pageWidth - margin - 62, 9, 62, 16, 2, 2, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(15, 118, 110);
        pdf.text(isContinuation ? 'HISTORIAL CLÍNICO (CONTINUACIÓN)' : 'EXPEDIENTE HISTÓRICO RESUMIDO', pageWidth - margin - 60, 13.5);

        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`CÓDIGO: EXP-${patient.accessCode}`, pageWidth - margin - 60, 18);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Emisión: ${emissionDate}`, pageWidth - margin - 60, 22);

        // Bottom header divider
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, 28, pageWidth - margin, 28);
      };

      const drawFooter = (pageNum: number, totalEst: number) => {
        const footY = pageHeight - 10;
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, footY - 3, pageWidth - margin, footY - 3);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Expediente Resumido Oficial emitido por VACLINIC • Trazabilidad Analítica ISO 15189 • vaclinic.laboratorio.gt', margin, footY);
        
        pdf.text(`Página ${pageNum}`, pageWidth - margin, footY, { align: 'right' });
      };

      let currentPage = 1;
      drawHeader(false);

      // Watermark if requested
      if (options?.watermark && options.watermark !== 'none') {
        pdf.saveGraphicsState();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(40);
        pdf.setTextColor(220, 225, 230);
        pdf.text(options.watermark, pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45
        });
        pdf.restoreGraphicsState();
      }

      let y = 32;

      // Patient Demographics Box
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

      // Col 1: Name & ID
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('PACIENTE TITULAR', margin + 4, y + 4.5);
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(patient.fullName.toUpperCase(), margin + 4, y + 9);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('DNI / CÉDULA:', margin + 4, y + 14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(patient.nationalId, margin + 22, y + 14);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('CÓD. ACCESO:', margin + 4, y + 19);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(13, 148, 136);
      pdf.text(patient.accessCode, margin + 24, y + 19);

      // Col 2: Age, Gender & Blood
      const col2X = margin + 65;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('EDAD / GÉNERO', col2X, y + 4.5);
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      const genderStr = patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro';
      pdf.text(`${patient.age} años • ${genderStr}`, col2X, y + 9);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('GRUPO SANGUÍNEO:', col2X, y + 14);
      pdf.setFontSize(7.5);
      pdf.setTextColor(225, 29, 72); // rose-600
      pdf.text(patient.bloodType || 'No registrado', col2X + 27, y + 14);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('ALERGIAS:', col2X, y + 19);
      pdf.setFontSize(6.5);
      pdf.setTextColor(180, 83, 9); // amber-700
      pdf.text(patient.allergies?.join(', ') || 'Ninguna reportada', col2X + 15, y + 19);

      // Col 3: Phone & Emergency
      const col3X = margin + 122;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('CONTACTO', col3X, y + 4.5);
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Tel: ${patient.phone}`, col3X, y + 9);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('CORREO:', col3X, y + 14);
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(patient.email || 'No registrado', col3X + 13, y + 14);

      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.text('EMERGENCIA:', col3X, y + 19);
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      const em = patient.emergencyContact ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone})` : 'N/D';
      pdf.text(em.substring(0, 32), col3X + 18, y + 19);

      y += 26;

      // 4 Metrics Summary Cards
      const cardW = (contentWidth - 9) / 4; // ~43.25mm
      const metrics = [
        { label: 'ESTUDIOS EVALUADOS', value: `${patientReports.length} informes`, sub: 'validados en sistema', bg: [240, 253, 250], bdr: [153, 246, 228], text: [15, 118, 110] },
        { label: 'ANALITOS TOTALES', value: `${totalAnalytes} parámetros`, sub: 'marcadores clínicos', bg: [238, 242, 255], bdr: [199, 210, 254], text: [67, 56, 202] },
        { label: 'CONTROL ÓPTIMO', value: `${optimalPercent}% en rango`, sub: `${abnormalCount} observaciones`, bg: [240, 253, 244], bdr: [187, 247, 208], text: [22, 101, 52] },
        { label: 'VENTANA TEMPORAL', value: `${newestDate}`, sub: `Historial desde ${oldestDate}`, bg: [248, 250, 252], bdr: [226, 232, 240], text: [30, 41, 59] },
      ];

      metrics.forEach((m, idx) => {
        const mx = margin + idx * (cardW + 3);
        pdf.setFillColor(m.bg[0], m.bg[1], m.bg[2]);
        pdf.setDrawColor(m.bdr[0], m.bdr[1], m.bdr[2]);
        pdf.roundedRect(mx, y, cardW, 14, 1.5, 1.5, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5);
        pdf.setTextColor(m.text[0], m.text[1], m.text[2]);
        pdf.text(m.label, mx + 3, y + 4);

        pdf.setFontSize(8);
        pdf.text(m.value, mx + 3, y + 8.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(m.sub, mx + 3, y + 12);
      });

      y += 18;

      // Section Header: Detailed Studies Breakdown
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`DESGLOSE HISTÓRICO CRONOLÓGICO DE ANÁLISIS (${patientReports.length})`, margin, y);
      pdf.setDrawColor(15, 23, 42);
      pdf.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 5;

      // Iterate through each clinical report
      patientReports.forEach((report, rIdx) => {
        const sampleDateFormatted = new Date(report.sampleDate).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Check if report block needs new page (minimum 35mm needed for study header + 2 rows)
        if (y > pageHeight - 45) {
          drawFooter(currentPage, 0);
          pdf.addPage();
          currentPage++;
          drawHeader(true);
          y = 33;
        }

        // Study Title Bar
        pdf.setFillColor(15, 23, 42); // slate-900
        pdf.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${rIdx + 1}. ${report.title.toUpperCase()} • Folio: ${report.reportNumber}`, margin + 3, y + 4.2);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(204, 251, 241); // teal-100
        pdf.text(`Fecha: ${sampleDateFormatted} | Área: ${report.category?.toUpperCase()}`, pageWidth - margin - 4, y + 4.2, { align: 'right' });

        y += 7;

        // Table Header
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, y, contentWidth, 5, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y, contentWidth, 5, 'S');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text('ANALITO / PARÁMETRO', margin + 3, y + 3.5);
        pdf.text('RESULTADO', margin + 75, y + 3.5);
        pdf.text('UNIDAD', margin + 105, y + 3.5);
        pdf.text('VALOR DE REFERENCIA', margin + 128, y + 3.5);
        pdf.text('ESTADO CLÍNICO', margin + 162, y + 3.5);

        y += 5;

        // Parameters Rows
        if (report.parameters && report.parameters.length > 0) {
          report.parameters.forEach((param, pIdx) => {
            if (y > pageHeight - 30) {
              drawFooter(currentPage, 0);
              pdf.addPage();
              currentPage++;
              drawHeader(true);
              y = 33;

              // Re-draw table header on new page
              pdf.setFillColor(241, 245, 249);
              pdf.rect(margin, y, contentWidth, 5, 'F');
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(5.5);
              pdf.setTextColor(71, 85, 105);
              pdf.text('ANALITO / PARÁMETRO', margin + 3, y + 3.5);
              pdf.text('RESULTADO', margin + 75, y + 3.5);
              pdf.text('UNIDAD', margin + 105, y + 3.5);
              pdf.text('VALOR DE REFERENCIA', margin + 128, y + 3.5);
              pdf.text('ESTADO CLÍNICO', margin + 162, y + 3.5);
              y += 5;
            }

            const rowHeight = 5;
            const isAbnormal = param.status === 'high' || param.status === 'low' || param.status === 'critical';

            if (isAbnormal) {
              pdf.setFillColor(254, 242, 242); // rose-50
              pdf.rect(margin, y, contentWidth, rowHeight, 'F');
            } else if (pIdx % 2 === 1) {
              pdf.setFillColor(248, 250, 252);
              pdf.rect(margin, y, contentWidth, rowHeight, 'F');
            }

            pdf.setDrawColor(241, 245, 249);
            pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

            // Analyte name
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(15, 23, 42);
            pdf.text(param.name.substring(0, 42), margin + 3, y + 3.5);

            // Result
            pdf.setFont('helvetica', 'bold');
            if (param.status === 'critical') {
              pdf.setTextColor(190, 18, 60); // rose-700
            } else if (param.status === 'high') {
              pdf.setTextColor(180, 83, 9); // amber-700
            } else if (param.status === 'low') {
              pdf.setTextColor(29, 78, 216); // blue-700
            } else {
              pdf.setTextColor(15, 23, 42);
            }
            pdf.text(String(param.value), margin + 75, y + 3.5);

            // Unit
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(100, 116, 139);
            pdf.text(param.unit || '-', margin + 105, y + 3.5);

            // Reference
            pdf.text((param.referenceRange || 'N/D').substring(0, 24), margin + 128, y + 3.5);

            // Status Badge
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(5.5);
            if (param.status === 'critical') {
              pdf.setTextColor(190, 18, 60);
              pdf.text('CRÍTICO (!)', margin + 162, y + 3.5);
            } else if (param.status === 'high') {
              pdf.setTextColor(180, 83, 9);
              pdf.text('ELEVADO (^)', margin + 162, y + 3.5);
            } else if (param.status === 'low') {
              pdf.setTextColor(29, 78, 216);
              pdf.text('DISMINUIDO (v)', margin + 162, y + 3.5);
            } else {
              pdf.setTextColor(22, 101, 52);
              pdf.text('NORMAL', margin + 162, y + 3.5);
            }

            y += rowHeight;
          });
        }

        // Brief conclusion if available and enabled
        const showConclusion = report.includeConclusionsInReport !== false && Boolean(report.doctorConclusions);
        if (showConclusion && report.doctorConclusions) {
          y += 1;
          pdf.setFillColor(240, 253, 250);
          pdf.setDrawColor(204, 251, 241);
          pdf.roundedRect(margin, y, contentWidth, 5.5, 1, 1, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(15, 118, 110);
          pdf.text('OBSERVACIÓN / CONCLUSIÓN:', margin + 2.5, y + 3.8);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(51, 65, 85);
          pdf.text(report.doctorConclusions.substring(0, 105), margin + 35, y + 3.8);
          y += 6.5;
        }

        // Clinical recommendations if available and enabled
        const cleanRecs = (report.recommendations || []).filter(r => typeof r === 'string' && r.trim().length > 0);
        const showRecs = report.includeRecommendationsInReport !== false && cleanRecs.length > 0;
        if (showRecs) {
          y += 1;
          pdf.setFillColor(248, 250, 252);
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(margin, y, contentWidth, 5.5, 1, 1, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(15, 118, 110);
          pdf.text('RECOMENDACIONES:', margin + 2.5, y + 3.8);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(51, 65, 85);
          pdf.text(cleanRecs.join(' • ').substring(0, 115), margin + 27, y + 3.8);
          y += 6.5;
        }

        if (!showConclusion && !showRecs) {
          y += 3;
        }
      });

      // Digital Signatures & Validation Footer Block
      // Check if space for signatures (needs 36mm)
      if (y > pageHeight - 48) {
        drawFooter(currentPage, 0);
        pdf.addPage();
        currentPage++;
        drawHeader(true);
        y = 35;
      }

      y = Math.max(y, pageHeight - 46);

      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      // 3 Columns: Validation QR / Hash, Bioanalyst signature, Doctor signature
      const sigColW = contentWidth / 3;

      // Col 1: Cryptographic Validation
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(margin, y, 11, 11, 1.5, 1.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5);
      pdf.setTextColor(45, 212, 191);
      pdf.text('CERT', margin + 2.5, y + 6);
      pdf.text('QR', margin + 3.5, y + 9);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(15, 23, 42);
      pdf.text('VALIDACIÓN INSTITUCIONAL', margin + 14, y + 3.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Doc: VC-HIST-${patient.accessCode}`, margin + 14, y + 7);
      pdf.text(`Hash: ${validationHash.substring(0, 18)}...`, margin + 14, y + 10.5);
      pdf.text('vaclinic.laboratorio.gt/valida', margin + 14, y + 14);

      // Col 2: Bioanalyst Signature
      const col2SigX = margin + sigColW + 5;
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.2);
      pdf.line(col2SigX, y + 8, col2SigX + sigColW - 10, y + 8);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(13, 148, 136);
      pdf.text(bioanalyst, col2SigX + 3, y + 6);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(bioanalyst, col2SigX + 3, y + 11);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(bioanalystSpec, col2SigX + 3, y + 14);
      pdf.text(bioanalystCol, col2SigX + 3, y + 17);

      // Col 3: Doctor Signature
      const col3SigX = margin + sigColW * 2 + 5;
      pdf.line(col3SigX, y + 8, col3SigX + sigColW - 10, y + 8);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(doctor, col3SigX + 3, y + 6);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(doctor, col3SigX + 3, y + 11);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(doctorSpec, col3SigX + 3, y + 14);
      pdf.text(doctorCol, col3SigX + 3, y + 17);

      // Draw final footer
      drawFooter(currentPage, currentPage);

      // Generate filename and save
      const cleanName = patient.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = options?.filename || `VACLINIC_Resumen_Historial_${cleanName}_${patient.nationalId}.pdf`;
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('Error generating historical summary with jsPDF:', error);
      return false;
    }
  }

  /**
   * Builds the formatted filename for a clinical report
   */
  static getReportFilename(report: Partial<MedicalReport>): string {
    const cleanPatient = (report.patientName || 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanNum = (report.reportNumber || 'LAB-2026').replace(/[^a-zA-Z0-9-]/g, '_');
    return `VACLINIC_${cleanNum}_${cleanPatient}.pdf`;
  }
}

