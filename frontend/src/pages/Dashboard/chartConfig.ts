// /pages/Dashboard/chartConfig.ts
import { DatosMensuales } from './types';

// Función de formateo para gráficos de torta
export const formatPercentage = (value: number, context: any): string => {
  const data = Array.isArray(context.dataset.data)
    ? context.dataset.data.filter((val: any): val is number => typeof val === 'number')
    : [];
  const total = data.reduce((acc: number, val: number) => acc + val, 0);
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return `${percentage}% (${value})`;
};

// Preparar datos para gráfico de contratos
export const prepararDatosContratos = (estadisticasContratos: {[key: string]: number}) => {
  const labels = Object.keys(estadisticasContratos);
  const data = labels.map(label => estadisticasContratos[label]);
  const backgroundColors = [
    '#ff9800', '#4caf50', '#9c27b0', '#03a9f4', '#f44336', 
    '#ffeb3b', '#795548', '#607d8b', '#009688', '#e91e63'
  ];
  
  return {
    labels,
    datasets: [
      {
        label: 'Contratos',
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };
};

// Preparar datos para gráfico de nómina mensual
export const prepararDatosNomina = (datosMensuales: DatosMensuales) => {
  // Filtrar solo los meses con datos
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => datosMensuales[mes].totalNomina > 0)
    .sort((a, b) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.indexOf(a) - meses.indexOf(b);
    });
  
  const valores = mesesConDatos.map(mes => Math.round(datosMensuales[mes].totalNomina));
  
  return {
    labels: mesesConDatos,
    datasets: [
      {
        label: 'Acumulado Mensual',
        data: valores,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

// Preparar datos para gráfico de seguridad social
export const prepararDatosAportesSeguridadSocial = (datosMensuales: DatosMensuales) => {
  // Filtrar solo los meses con datos
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => 
      (datosMensuales[mes].pensionEmpleado + datosMensuales[mes].saludEmpleado) > 0 || 
      (datosMensuales[mes].pensionEmpleador + datosMensuales[mes].saludEmpleador) > 0
    )
    .sort((a, b) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.indexOf(a) - meses.indexOf(b);
    });
  
  // Sumar aportes de empleado (pensión + salud)
  const aportesEmpleado = mesesConDatos.map(mes => 
    Math.round(datosMensuales[mes].pensionEmpleado + datosMensuales[mes].saludEmpleado)
  );
  
  // Sumar aportes de empleador (pensión + salud)
  const aportesEmpleador = mesesConDatos.map(mes => 
    Math.round(datosMensuales[mes].pensionEmpleador + datosMensuales[mes].saludEmpleador)
  );
  
  return {
    labels: mesesConDatos,
    datasets: [
      {
        label: 'Empleado',
        data: aportesEmpleado,
        backgroundColor: '#1976d2',
        barThickness: 25,
      },
      {
        label: 'Empleador',
        data: aportesEmpleador,
        backgroundColor: '#4caf50',
        barThickness: 25,
      }
    ],
  };
};

// Preparar datos para gráfico de aportes parafiscales
export const prepararDatosAportesParafiscales = (datosMensuales: DatosMensuales) => {
  // Filtrar solo los meses con datos
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => 
      datosMensuales[mes].senaEmpleador > 0 || 
      datosMensuales[mes].icbf > 0 || 
      datosMensuales[mes].cajaCompensacion > 0 ||
      datosMensuales[mes].riesgosLaborales > 0
    )
    .sort((a, b) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.indexOf(a) - meses.indexOf(b);
    });
  
  // Separar los datos para cada componente
  const datosSena = mesesConDatos.map(mes => Math.round(datosMensuales[mes].senaEmpleador));
  const datosICBF = mesesConDatos.map(mes => Math.round(datosMensuales[mes].icbf));
  const datosCCF = mesesConDatos.map(mes => Math.round(datosMensuales[mes].cajaCompensacion));
  const datosRiesgos = mesesConDatos.map(mes => Math.round(datosMensuales[mes].riesgosLaborales));
  
  return {
    labels: mesesConDatos,
    datasets: [
      {
        label: 'SENA',
        data: datosSena,
        backgroundColor: '#ff9800',
        barThickness: 15,
      },
      {
        label: 'ICBF',
        data: datosICBF,
        backgroundColor: '#f57c00',
        barThickness: 15,
      },
      {
        label: 'Caja Compensación',
        data: datosCCF,
        backgroundColor: '#e65100',
        barThickness: 15,
      },
      {
        label: 'Riesgos Laborales',
        data: datosRiesgos,
        backgroundColor: '#ff5722',
        barThickness: 15,
      }
    ],
  };
};

// Preparar datos para gráfico de prestaciones sociales
export const prepararDatosPrestacionesSociales = (datosMensuales: DatosMensuales) => {
  // Filtrar solo los meses con datos
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => 
      datosMensuales[mes].cesantias > 0 || 
      datosMensuales[mes].primaServicios > 0 || 
      datosMensuales[mes].vacaciones > 0
    )
    .sort((a, b) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.indexOf(a) - meses.indexOf(b);
    });
  
  const cesantias = mesesConDatos.map(mes => Math.round(datosMensuales[mes].cesantias));
  const primaServicios = mesesConDatos.map(mes => Math.round(datosMensuales[mes].primaServicios));
  const vacaciones = mesesConDatos.map(mes => Math.round(datosMensuales[mes].vacaciones));
  
  return {
    labels: mesesConDatos,
    datasets: [
      {
        label: 'Cesantías',
        data: cesantias,
        backgroundColor: '#9c27b0',
        barThickness: 20,
      },
      {
        label: 'Prima de Servicios',
        data: primaServicios,
        backgroundColor: '#ba68c8',
        barThickness: 20,
      },
      {
        label: 'Vacaciones',
        data: vacaciones,
        backgroundColor: '#ce93d8',
        barThickness: 20,
      },
    ],
  };
};

// Preparar datos para gráfico de préstamos empresa
export const prepararDatosPrestamoEmpresa = (datosMensuales: DatosMensuales) => {
  // Filtrar solo los meses con datos
  const mesesConDatos = Object.keys(datosMensuales)
    .filter(mes => datosMensuales[mes].prestamoEmpresa > 0)
    .sort((a, b) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.indexOf(a) - meses.indexOf(b);
    });
  
  const prestamos = mesesConDatos.map(mes => Math.round(datosMensuales[mes].prestamoEmpresa));
  
  return {
    labels: mesesConDatos,
    datasets: [
      {
        label: 'Préstamos Empresa',
        data: prestamos,
        backgroundColor: '#f44336',
        barThickness: 30,
      },
    ],
  };
};