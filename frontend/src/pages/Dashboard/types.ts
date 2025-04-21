// /pages/Dashboard/types.ts

export interface ContratoData {
    id?: number;
    id_persona: number;
    primer_nombre?: string;
    segundo_nombre?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    identificacion?: number;
    id_tipo_contrato: number;
    tipo_contrato_nombre?: string;
    salario: number;
    estado: boolean;
    [key: string]: any;
  }
  
  export interface PersonaData {
    id: number;
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    identificacion: string;
    sexo: number;
    estado_empleado: boolean;
    [key: string]: any;
  }
  
  export interface PlanillaData {
    id: number;
    fecha_inicial: string;
    fecha_final: string;
    id_periodicidad: number;
    periodicidad_nombre: string;
  }
  
  export interface PlanillaDetalleData {
    id: number;
    id_planilla: number;
    id_persona: number;
    salario_base: number;
    pago_neto: number;
    salud_empleado: number;
    salud_empleador: number;
    pension_empleado: number;
    pension_empleador: number;
    sena_empleador: number;
    icbf: number;
    caja_compensacion_familiar: number;
    cesantias: number;
    prima_servicios: number;
    vacaciones: number;
    riesgos_laborales: number;
    prestamo_empresa: number;
    nombre_completo: string;
    [key: string]: any;
  }
  
  export interface AuthData {
    empresaId?: number;
    email?: string;
    schemaName?: string;
  }
  
  export interface DatosMensuales {
    [mes: string]: {
      totalNomina: number;
      // Aportes de seguridad social
      pensionEmpleado: number;
      saludEmpleado: number;
      pensionEmpleador: number;
      saludEmpleador: number;
      // Aportes parafiscales
      senaEmpleador: number;
      icbf: number;
      cajaCompensacion: number;
      riesgosLaborales: number;
      // Prestaciones sociales
      cesantias: number;
      primaServicios: number;
      vacaciones: number;
      // Otros
      prestamoEmpresa: number;
    }
  }