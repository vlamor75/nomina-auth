// frontend\src\pages\Planilla\PlanillaDetalle\types.ts
export interface PlanillaDetalleData {
    id?: number;
    id_planilla: number;
    id_persona: number;
    salario_base: number;
    dias_a_pagar: number;
    auxilio: number;
    valor_total_horas_extras: number;
    horas_extras: number;
    recargos_nocturnos: number;
    recargo_nocturno: number;
    pago_neto: number;
    id_contrato: number;
    id_tipo_pago: number;
    nombre_completo?: string;
    contrato_nombre?: string;
    tipo_pago_nombre?: string;
    id_tipo_vinculacion?: number;
    id_tipo_contrato?: number;
    salud_empleado: number;
    pension_empleado: number;
    embargo: number;
    otros_descuentos: number;
    prestamo_empresa: number;
    retencion_en_la_fuente: number;
    salud_empleador: number;
    pension_empleador: number;
    sena_empleador: number;
    ICBF: number;
    caja_compensacion_familiar: number;
    cesantias: number;
    prima_servicios: number;
    vacaciones: number;
    riesgos_laborales: number;
    diurna: number;
    nocturna: number;
    diurna_festivo: number;
    nocturna_festivo: number;
    [key: string]: any;
  }
  
  export interface PersonaItem {
    id: number;
    nombre_completo: string;
  }
  
  export interface CatalogoItem {
    id: number;
    nombre: string;
  }
  
  export interface ContratoItem {
    id: number;
    nombre: string;
    salario?: string;
    id_persona: number;
    id_tipo_vinculacion?: number;
    id_tipo_contrato?: number;
    tipo_vinculacion_nombre?: string;
    tipo_contrato_nombre?: string;
    estado?: boolean; // Para cargar contratos activos
  }
  
  export interface HoraExtraType {
    tipo: string;
    horario: string;
    recargo: number;
    descripcion: string;
  }
  
  export interface RecargoNocturnoType {
    tipo: string;
    horario: string;
    recargo: number;
    descripcion: string;
  }
  
  export interface DeduccionType {
    tipo: string;
    porcentaje: number;
    descripcion: string;
    editable: boolean;
  }