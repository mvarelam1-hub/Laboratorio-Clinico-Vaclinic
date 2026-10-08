import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MedicalReport } from '../../types';

vi.mock('../../context/ClinicContext', () => ({
  useClinic: () => ({
    labSettings: {
      labName: 'VACLINIC', slogan: '', phone: '5555', address: 'Dirección real', email: 'a@b.c',
      sanitaryLicense: 'LICENCIA-NO-CONFIRMADA', primaryColor: '#0f766e', logoUrl: '',
      signers: [
        { id: 's1', enabled: true, roleTitle: 'Firma del Químico Biólogo', name: 'Persona Real', specialty: 'QB', licenseNumber: 'NUM-NO-CONFIRMADO', signatureType: 'image', showStamp: false, showValidationHash: false },
        { id: 's2', enabled: false, roleTitle: 'Otro', name: 'Deshabilitado', specialty: '', licenseNumber: '', signatureType: 'image', showStamp: false, showValidationHash: false }
      ]
    },
    orders: [{ id: 'o1', orderNumber: '#164', codigoConsulta: 'K7M2QX' }]
  })
}));

import { VaclinicOfficialReportSheet } from './VaclinicOfficialReportSheet';

const base = {
  id: 'r1', reportNumber: 'INF-1', patientId: 'p1', patientName: 'JOEL RUIZ', patientNationalId: '52446',
  patientAge: 25, patientGender: 'M', category: 'bioquimica', title: 'Helicobacter', sampleDate: '2026-10-04',
  emissionDate: '2026-10-04', status: 'borrador', orderId: 'o1', recommendations: [],
  parameters: [
    { id: 'a', name: 'Helicobacter pylori en heces cuantitativa', value: '25', unit: 'U/mL', referenceRange: '0-15', minVal: 0, maxVal: 15, status: 'normal' },
    { id: 'b', name: 'Glucosa en Ayunas', value: '', unit: 'mg/dL', referenceRange: '70 - 100', minVal: 70, maxVal: 100, status: 'normal' }
  ]
} as unknown as MedicalReport;

const html = renderToStaticMarkup(React.createElement(VaclinicOfficialReportSheet, { report: base }));

describe('VaclinicOfficialReportSheet (informe limpio)', () => {
  it('no incluye columna Calibrador, herramientas de simulación ni sombras', () => {
    expect(html).not.toMatch(/calibrador/i);
    expect(html).not.toMatch(/Control demogr/i);
    expect(html).not.toMatch(/Rango Estándar General/);
    expect(html).not.toMatch(/shadow/);
    expect(html).not.toMatch(/gradient/);
  });

  it('muestra el código de consulta y el número de la orden reales', () => {
    expect(html).toContain('K7M2QX');
    expect(html).toContain('#164');
  });

  it('firma solo con los firmantes habilitados en Ajustes y sin números sin confirmar', () => {
    expect(html).toContain('Persona Real');
    expect(html).not.toContain('Deshabilitado');
    expect(html).not.toContain('NUM-NO-CONFIRMADO');
    expect(html).not.toContain('LICENCIA-NO-CONFIRMADA');
    expect(html).not.toMatch(/Cristian J\. Arevalo|COL\. 4584|MSPAS #1102/);
  });

  it('no inventa datos del paciente cuando faltan', () => {
    const sin = renderToStaticMarkup(
      React.createElement(VaclinicOfficialReportSheet, {
        report: { ...base, patientAge: 0, patientGender: '', patientNationalId: '', orderId: undefined } as unknown as MedicalReport
      })
    );
    expect(sin).not.toMatch(/81 años|3632 9134|DU3HYB|VAC-000030|135-2026/);
    expect(sin).not.toContain('K7M2QX');
  });

  it('marca el resultado fuera de rango con flecha y el pendiente sin indicador', () => {
    expect(html).toContain('▲ Alto');
    expect(html).toContain('Pendiente');
  });
});
