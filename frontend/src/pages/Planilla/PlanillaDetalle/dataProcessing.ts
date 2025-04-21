// frontend\src\pages\Planilla\PlanillaDetalle\dataProcessing.ts
import {
    PlanillaDetalleData, HoraExtraType, RecargoNocturnoType, DeduccionType,
  } from './types';
  
  export const TIPOS_HORAS_EXTRAS: HoraExtraType[] = [
    { tipo: 'Diurna', horario: '6:00 a.m. - 9:00 p.m.', recargo: 0.25, descripcion: 'Trabajo adicional diurno.' },
    { tipo: 'Nocturna', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.75, descripcion: 'Trabajo adicional nocturno.' },
    { tipo: 'Diurna en Domingo/Festivo', horario: '6:00 a.m. - 9:00 p.m.', recargo: 1.0, descripcion: 'Trabajo festivo diurno.' },
    { tipo: 'Nocturna en Domingo/Festivo', horario: '9:00 p.m. - 6:00 a.m.', recargo: 1.5, descripcion: 'Trabajo festivo nocturno.' },
  ];
  
  export const RECARGOS_NOCTURNOS: RecargoNocturnoType[] = [
    { tipo: 'Recargo Nocturno', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.35, descripcion: 'Pago adicional nocturno.' },
  ];
  
  export const DEDUCCIONES: DeduccionType[] = [
    { tipo: 'Salud Empleado', porcentaje: 0.04, descripcion: 'Aporte salud empleado.', editable: false },
    { tipo: 'Salud Empleador', porcentaje: 0.085, descripcion: 'Aporte salud empleador.', editable: false },
    // Más deducciones...
  ];
  
  export const UMBRAL_AUXILIO_TRANSPORTE = 2847000;
  export const VALOR_AUXILIO_TRANSPORTE = 200000;
  
  export const calculateHoraExtraValue = (tipo: string, horas: number, salarioBase: number) => {
    const salarioPorHora = (salarioBase / 30) / 8;
    const horaExtra = TIPOS_HORAS_EXTRAS.find(h => h.tipo === tipo);
    return horaExtra ? Math.round(horas * salarioPorHora * (1 + horaExtra.recargo)) : 0;
  };
  
  export const calculateRecargoNocturnoValue = (tipo: string, horas: number, salarioBase: number) => {
    const salarioPorHora = (salarioBase / 30) / 8;
    const recargo = RECARGOS_NOCTURNOS.find(r => r.tipo === tipo);
    return recargo ? Math.round(horas * salarioPorHora * recargo.recargo) : 0;
  };
  
  export const calculateTotalIngresos = (
    formData: PlanillaDetalleData,
    horasExtrasData: { [key: string]: number },
    recargosNocturnosData: { [key: string]: number }
  ) => {
    const totalHorasExtras = TIPOS_HORAS_EXTRAS.reduce((sum, { tipo }) => {
      return sum + calculateHoraExtraValue(tipo, horasExtrasData[tipo] || 0, formData.salario_base);
    }, 0);
  
    const totalRecargosNocturnos = RECARGOS_NOCTURNOS.reduce((sum, { tipo }) => {
      return sum + calculateRecargoNocturnoValue(tipo, recargosNocturnosData[tipo] || 0, formData.salario_base);
    }, 0);
  
    const salarioPorDia = formData.salario_base / 30;
    const salarioPorDiasTrabajados = salarioPorDia * formData.dias_a_pagar;
    return Math.round(salarioPorDiasTrabajados + formData.auxilio + totalHorasExtras + totalRecargosNocturnos);
  };
  
  export const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);