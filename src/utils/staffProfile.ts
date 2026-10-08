import { LabStaffUser } from '../types';
import { INITIAL_ROLES_CONFIG } from '../shared/permissions';

/**
 * Perfil de personal armado SOLO con lo que confirma el servidor
 * (GET /api/auth/whoami o la respuesta del login). Nunca inventa colegiado,
 * especialidad ni teléfono: si no se conocen, quedan vacíos.
 */
export function perfilDesdeServidor(datos: {
  idUsuario: number;
  nombreCompleto: string;
  roleId: string;
  email?: string;
}): LabStaffUser {
  const rol = INITIAL_ROLES_CONFIG.find((r) => r.id === datos.roleId);
  const email = (datos.email || '').trim().toLowerCase();
  return {
    id: `usr-${datos.idUsuario}`,
    fullName: datos.nombreCompleto,
    username: email,
    email,
    phone: '',
    roleId: datos.roleId as LabStaffUser['roleId'],
    roleName: rol?.name || datos.roleId,
    specialty: '',
    licenseNumber: '',
    assignedBranch: 'todas',
    status: 'activo',
    pinCode: '',
    createdAt: new Date().toISOString(),
    remoteId: datos.idUsuario
  };
}

/** Marcador de "nadie ha iniciado sesión": no es una persona, no firma ni aparece en el chat. */
export const USUARIO_SIN_SESION: LabStaffUser = {
  id: 'sin-sesion',
  fullName: 'Sin sesión',
  username: '',
  email: '',
  phone: '',
  roleId: 'recepcionista',
  roleName: '',
  specialty: '',
  licenseNumber: '',
  assignedBranch: 'todas',
  status: 'inactivo',
  pinCode: '',
  createdAt: '1970-01-01T00:00:00.000Z'
};

export const esUsuarioSinSesion = (u: Pick<LabStaffUser, 'id'> | null | undefined): boolean => !u || u.id === USUARIO_SIN_SESION.id;
