/**
 * Composición de perfiles y paneles del catálogo.
 *
 * Los paneles PAN-02…PAN-10 ya traen `includedParameters` (nombres) en el
 * catálogo de fábrica. Estos otros perfiles NO la traían, así que al pedirlos
 * el informe salía con una sola fila vacía. Aquí se define de qué exámenes del
 * MISMO catálogo se componen (por código). Es una composición por defecto,
 * basada en los exámenes que ya existen como componentes (precio Q0) en el
 * catálogo; el laboratorio debe confirmarla y puede ajustarla desde
 * "Catálogo y Perfiles".
 */
export const COMPOSICION_POR_CODIGO: Record<string, string[]> = {
  // Hemograma completo (BHC): serie blanca, roja, plaquetas y diferencial.
  'HEM-10': [
    'HEM-06', 'HEM-07', 'HEM-11', 'HEM-09', 'HEM-19', 'HEM-12', 'HEM-03', 'HEM-01',
    'HEM-16', 'HEM-20', 'HEM-15', 'HEM-13', 'HEM-14', 'HEM-04', 'HEM-02'
  ],
  // Examen general de orina: físico, químico y sedimento.
  'URO-33': [
    'URO-12', 'URO-03', 'URO-17', 'URO-36', 'URO-38', 'URO-22', 'URO-06', 'URO-16', 'URO-32', 'URO-47',
    'URO-45', 'URO-39', 'URO-01', 'URO-20', 'URO-21', 'URO-08', 'URO-09', 'URO-04', 'URO-11', 'URO-15',
    'URO-30', 'URO-28'
  ],
  // Examen general de heces: macroscópico y microscópico.
  'URO-24': [
    'URO-13', 'URO-14', 'URO-31', 'URO-41', 'URO-37', 'URO-43', 'URO-18', 'URO-27', 'URO-23', 'URO-26',
    'URO-02', 'URO-19', 'URO-10', 'URO-05'
  ],
  // Panel de parásitos.
  'URO-34': ['URO-40', 'URO-46', 'URO-25', 'URO-29']
};

/**
 * Nombres abreviados que usan los paneles en `includedParameters` → código del
 * examen del catálogo. Clave normalizada (minúsculas, sin acentos ni signos).
 * Un nombre puede expandirse a varios códigos (p. ej. bilirrubina T/D/I).
 */
export const ALIAS_COMPONENTE: Record<string, string[]> = {
  'ttpa': ['PAN-13'], 'aptt': ['PAN-13'], 'pt tiempo de protrombina': ['PAN-11'], 'tt tiempo de trombina': ['PAN-12'],
  '% actividad': ['PAN-01'],
  'cloruro cl': ['QUI-13'], 'potasio k': ['QUI-35'], 'potasio': ['QUI-35'], 'sodio na': ['QUI-39'], 'sodio': ['QUI-39'],
  'calcio serico': ['QUI-11'], 'calcio': ['QUI-11'], 'magnesio': ['QUI-33'], 'fosfato': ['QUI-24'], 'fosforo': ['QUI-24'],
  'bilirrubina total': ['QUI-09'], 'bilirrubina directa': ['QUI-07'], 'bilirrubina indirecta': ['QUI-08'],
  'bilirrubina t/d/i': ['QUI-09', 'QUI-07', 'QUI-08'], 'bilirrubina t/d': ['QUI-09', 'QUI-07'],
  'albumina': ['QUI-04'], 'alt tgp': ['QUI-41'], 'tgp/alt': ['QUI-41'], 'alt': ['QUI-41'],
  'ast tgo': ['QUI-40'], 'tgo/ast': ['QUI-40'], 'ast': ['QUI-40'], 'ggt': ['QUI-25'],
  'relacion a/g': ['QUI-37'], 'relacion u/c': ['QUI-38'], 'glucosa': ['QUI-27'], 'glucosa pre': ['QUI-28'],
  'creatinina': ['QUI-21'], 'hdl': ['QUI-15'], 'ldl': ['QUI-16'], 'vldl': ['QUI-19'], 'colesterol': ['QUI-17'],
  'fosfatasa alcalina': ['QUI-23'], 'amilasa': ['QUI-05'], 'lipasa': ['QUI-32'], 'ck': ['QUI-12'],
  'bun': ['QUI-34'], 'urea': ['QUI-44'], 'acidos biliares': ['QUI-03'], 'bhb': ['QUI-06'], 'ldh': ['QUI-31'],
  'co2 total': ['QUI-14'], 'trigliceridos': ['QUI-42']
};
