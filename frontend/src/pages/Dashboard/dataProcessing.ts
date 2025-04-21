// /pages/Dashboard/dataProcessing.ts
import { ContratoData, PersonaData, PlanillaData, PlanillaDetalleData, DatosMensuales } from './types';

// Procesar estadísticas de contratos y empleados
export const procesarEstadisticasContratos = (contratos: ContratoData[], personas: PersonaData[]) => {
  // Filtrar solo contratos activos
  const contratosActivos = contratos.filter(contrato => contrato.estado === true);
  
  // Crear mapa de personas para acceso rápido
  const personasMap = new Map<number, PersonaData>();
  personas.forEach(persona => {
    personasMap.set(persona.id, persona);
  });
  
  // Contar hombres y mujeres según el campo sexo en la tabla de personas
  let hombres = 0;
  let mujeres = 0;
  
  // Diccionario para contar tipos de contrato
  const tiposContrato: {[key: string]: number} = {};
  
  contratosActivos.forEach(contrato => {
    // Obtener datos de la persona asociada al contrato
    const persona = personasMap.get(contrato.id_persona);
    
    if (persona) {
      // Contar por género (1: Masculino, 2: Femenino)
      if (persona.sexo === 1) {
        hombres++;
      } else if (persona.sexo === 2) {
        mujeres++;
      }
    }
    
    // Contar por tipo de contrato
    const tipoContrato = contrato.tipo_contrato_nombre || 'Desconocido';
    
    if (tiposContrato[tipoContrato]) {
      tiposContrato[tipoContrato]++;
    } else {
      tiposContrato[tipoContrato] = 1;
    }
  });
  
  // Retornar estadísticas
  return {
    estadisticasEmpleados: {
      hombres,
      mujeres,
      total: hombres + mujeres
    },
    estadisticasContratos: tiposContrato
  };
};

// Procesar estadísticas de planillas
export const procesarEstadisticasPlanillas = (detalles: PlanillaDetalleData[], planillas: PlanillaData[]) => {
  // Crear un mapa para vincular planillas con sus fechas
  const planillaMap = new Map<number, PlanillaData>();
  planillas.forEach(planilla => {
    planillaMap.set(planilla.id, planilla);
  });
  
  // Organizar datos por mes
  const datosPorMes: DatosMensuales = {};
  
  // Meses del año para ordenar los resultados
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Inicializar estructura de datos
  meses.forEach(mes => {
    datosPorMes[mes] = {
      totalNomina: 0,
      // Aportes de seguridad social
      pensionEmpleado: 0,
      saludEmpleado: 0,
      pensionEmpleador: 0,
      saludEmpleador: 0,
      // Aportes parafiscales
      senaEmpleador: 0,
      icbf: 0,
      cajaCompensacion: 0,
      riesgosLaborales: 0,
      // Prestaciones sociales
      cesantias: 0,
      primaServicios: 0,
      vacaciones: 0,
      // Otros
      prestamoEmpresa: 0
    };
  });
  
  // Agrupar detalles por planilla y mes
  detalles.forEach(detalle => {
    const planilla = planillaMap.get(detalle.id_planilla);
    
    if (planilla) {
      // Obtener mes de la fecha inicial de la planilla
      const fechaInicial = new Date(planilla.fecha_inicial);
      const mes = meses[fechaInicial.getMonth()];
      
      // Acumular pago neto
      datosPorMes[mes].totalNomina += detalle.pago_neto;
      
      // Acumular aportes de seguridad social
      datosPorMes[mes].pensionEmpleado += detalle.pension_empleado;
      datosPorMes[mes].saludEmpleado += detalle.salud_empleado;
      datosPorMes[mes].pensionEmpleador += detalle.pension_empleador;
      datosPorMes[mes].saludEmpleador += detalle.salud_empleador;
      
      // Acumular aportes parafiscales
      datosPorMes[mes].senaEmpleador += detalle.sena_empleador;
      datosPorMes[mes].icbf += detalle.icbf;
      datosPorMes[mes].cajaCompensacion += detalle.caja_compensacion_familiar;
      datosPorMes[mes].riesgosLaborales += detalle.riesgos_laborales || 0;
      
      // Acumular prestaciones sociales
      datosPorMes[mes].cesantias += detalle.cesantias;
      datosPorMes[mes].primaServicios += detalle.prima_servicios;
      datosPorMes[mes].vacaciones += detalle.vacaciones;
      
      // Otros descuentos
      datosPorMes[mes].prestamoEmpresa += detalle.prestamo_empresa || 0;
    }
  });
  
  return datosPorMes;
};

// Obtener el último mes con datos para mostrar en el resumen
export const obtenerUltimoMesConDatos = (datosMensuales: DatosMensuales) => {
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => datosMensuales[mes].totalNomina > 0);
  
  if (mesesConDatos.length === 0) return 'N/A';
  
  const mesesOrdenados = ['Diciembre', 'Noviembre', 'Octubre', 'Septiembre', 'Agosto', 'Julio',
                         'Junio', 'Mayo', 'Abril', 'Marzo', 'Febrero', 'Enero'];
  
  for (const mes of mesesOrdenados) {
    if (mesesConDatos.includes(mes) && datosMensuales[mes].totalNomina > 0) {
      return mes;
    }
  }
  
  return mesesConDatos[mesesConDatos.length - 1];
};

// Calcular total anual de nómina
export const calcularTotalAnual = (datosMensuales: DatosMensuales) => {
  return Object.values(datosMensuales).reduce((total, datos) => total + datos.totalNomina, 0);
};

// Formatear valores monetarios
export const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};