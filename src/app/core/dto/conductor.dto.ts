
import type {
    EstadoConductor
} from '../models/conductor';

/**
 * Contrato JSON empresarial de Conductores.
 * Convención: español, minúsculas y snake_case.
 */
export interface ConductorDto {
    id: string;
    nombre_completo: string;
    categoria_licencia: string;
    estado: EstadoConductor;

    vehiculo_asignado_id?: string;
    vencimiento_licencia?: string;
}
