import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  IconButton, FormControlLabel, Radio, RadioGroup, FormLabel,
  Card, CardContent, CardActions, Tabs, Tab, Grid, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  EventNote as EventNoteIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface PlanillaDetalleData {
  id?: number;
  id_planilla: number;
  id_persona: number;
  salario_base: number;
  dias_a_pagar: number;
  auxilio: number;
  valor_total_horas_extras: number;
  horas_extras: number; // Total hours for horas extras
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
  diurna: number; // Will store monetary value
  nocturna: number; // Will store monetary value
  diurna_festivo: number; // Will store monetary value
  nocturna_festivo: number; // Will store monetary value
  [key: string]: any;
}

interface PersonaItem {
  id: number;
  nombre_completo: string;
}

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface ContratoItem {
  id: number;
  nombre: string;
  salario?: string;
  id_tipo_vinculacion?: number;
  id_tipo_contrato?: number;
  tipo_vinculacion_nombre?: string;
  tipo_contrato_nombre?: string;
}

interface PlanillaDetalleProps {
  clienteId: number;
  planillaId: number;
}

const PLANILLA_DETALLE_API_URL = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';
const CONTRATO_API_URL = 'https://p57h6xk7al.execute-api.us-east-1.amazonaws.com/dev/crud_contrato';

const UMBRAL_AUXILIO_TRANSPORTE = 2847000;
const VALOR_AUXILIO_TRANSPORTE = 200000;

const TIPOS_HORAS_EXTRAS = [
  { tipo: 'Diurna', horario: '6:00 a.m. - 9:00 p.m.', recargo: 0.25, descripcion: 'Trabajo adicional realizado durante el horario diurno.' },
  { tipo: 'Nocturna', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.75, descripcion: 'Trabajo suplementario realizado en horario nocturno.' },
  { tipo: 'Diurna en Domingo/Festivo', horario: '6:00 a.m. - 9:00 p.m.', recargo: 1.0, descripcion: 'Trabajo adicional en días festivos o domingos durante el horario diurno.' },
  { tipo: 'Nocturna en Domingo/Festivo', horario: '9:00 p.m. - 6:00 a.m.', recargo: 1.5, descripcion: 'Trabajo suplementario realizado en horario nocturno durante domingos o festivos.' },
];

const RECARGOS_NOCTURNOS = [
  { tipo: 'Recargo Nocturno', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.35, descripcion: 'Pago adicional por trabajar en horario nocturno, independientemente de que sean horas extras o no. Máximo 270 horas al mes (9 horas por día).' },
];

const DEDUCCIONES = [
  { tipo: 'Salud Empleado', porcentaje: 0.04, descripcion: 'Aporte a salud del empleado (4% del salario base).', editable: false },
  { tipo: 'Salud Empleador', porcentaje: 0.085, descripcion: 'Aporte a salud del empleador (8.5% del salario base).', editable: false },
  { tipo: 'Pensión Empleado', porcentaje: 0.04, descripcion: 'Aporte a pensión del empleado (4% del salario base).', editable: false },
  { tipo: 'Pensión Empleador', porcentaje: 0.12, descripcion: 'Aporte a pensión del empleador (12% del salario base).', editable: false },
  { tipo: 'SENA Empleador', porcentaje: 0.02, descripcion: 'Aporte al SENA del empleador (2% del salario base).', editable: false },
  { tipo: 'ICBF', porcentaje: 0.03, descripcion: 'Aporte al ICBF del empleador (3% del salario base).', editable: false },
  { tipo: 'Caja Compensación Familiar', porcentaje: 0.04, descripcion: 'Aporte a caja de compensación familiar del empleador (4% del salario base).', editable: false },
  { tipo: 'Cesantías', porcentaje: 0.0833, descripcion: 'Aporte a cesantías del empleador (8.33% del salario base).', editable: false },
  { tipo: 'Prima de Servicios', porcentaje: 0.0833, descripcion: 'Aporte a prima de servicios del empleador (8.33% del salario base).', editable: false },
  { tipo: 'Vacaciones', porcentaje: 0.0417, descripcion: 'Aporte a vacaciones del empleador (4.17% del salario base).', editable: false },
  { tipo: 'Riesgos Laborales', porcentaje: 0, descripcion: 'Aporte a riesgos laborales del empleador (porcentaje variable).', editable: false },
  { tipo: 'Embargo', porcentaje: 0, descripcion: 'Deducción por embargo (porcentaje definido por el usuario).', editable: true },
  { tipo: 'Otros Descuentos', porcentaje: 0, descripcion: 'Otros descuentos definidos por el usuario.', editable: true },
  { tipo: 'Préstamo Empresa', porcentaje: 0, descripcion: 'Deducción por préstamo de la empresa (porcentaje definido por el usuario).', editable: true },
  { tipo: 'Retención en la Fuente', porcentaje: 0, descripcion: 'Deducción por retención en la fuente (porcentaje definido por el usuario).', editable: true },
];

const MAX_HORAS_NOCTURNAS_POR_DIA = 9;
const MAX_HORAS_NOCTURNAS_MENSUAL = 270;

const PlanillaDetalle: React.FC<PlanillaDetalleProps> = ({ clienteId, planillaId }) => {
  const [planillaDetalles, setPlanillaDetalles] = useState<PlanillaDetalleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<PlanillaDetalleData>({
    id_planilla: planillaId,
    id_persona: 0,
    salario_base: 0,
    dias_a_pagar: 30,
    auxilio: 0,
    valor_total_horas_extras: 0,
    horas_extras: 0,
    recargos_nocturnos: 0,
    recargo_nocturno: 0,
    pago_neto: 0,
    id_contrato: 0,
    id_tipo_pago: 0,
    salud_empleado: 0,
    pension_empleado: 0,
    embargo: 0,
    otros_descuentos: 0,
    prestamo_empresa: 0,
    retencion_en_la_fuente: 0,
    salud_empleador: 0,
    pension_empleador: 0,
    sena_empleador: 0,
    ICBF: 0,
    caja_compensacion_familiar: 0,
    cesantias: 0,
    prima_servicios: 0,
    vacaciones: 0,
    riesgos_laborales: 0,
    diurna: 0,
    nocturna: 0,
    diurna_festivo: 0,
    nocturna_festivo: 0,
  });

  const [requiereAuxilio, setRequiereAuxilio] = useState<'si' | 'no'>('no');
  const [novedadesDialogOpen, setNovedadesDialogOpen] = useState(false);
  const [horasExtrasData, setHorasExtrasData] = useState<{ [key: string]: number }>({
    'Diurna': 0,
    'Nocturna': 0,
    'Diurna en Domingo/Festivo': 0,
    'Nocturna en Domingo/Festivo': 0,
  });
  const [recargosNocturnosData, setRecargosNocturnosData] = useState<{ [key: string]: number }>({
    'Recargo Nocturno': 0,
  });
  const [deduccionesData, setDeduccionesData] = useState<{ [key: string]: number }>({
    'Salud Empleado': 0.04,
    'Salud Empleador': 0.085,
    'Pensión Empleado': 0.04,
    'Pensión Empleador': 0.12,
    'SENA Empleador': 0.02,
    'ICBF': 0.03,
    'Caja Compensación Familiar': 0.04,
    'Cesantías': 0.0833,
    'Prima de Servicios': 0.0833,
    'Vacaciones': 0.0417,
    'Riesgos Laborales': 0,
    'Embargo': 0,
    'Otros Descuentos': 0,
    'Préstamo Empresa': 0,
    'Retención en la Fuente': 0,
  });
  const [editHoraExtra, setEditHoraExtra] = useState<string | null>(null);
  const [editRecargoNocturno, setEditRecargoNocturno] = useState<string | null>(null);
  const [editDeduccion, setEditDeduccion] = useState<string | null>(null);
  const [editHorasValue, setEditHorasValue] = useState<number>(0);
  const [editDeduccionValue, setEditDeduccionValue] = useState<number>(0);
  const [tabValue, setTabValue] = useState(0);

  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [contratos, setContratos] = useState<ContratoItem[]>([]);
  const [tiposPago, setTiposPago] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [idTipoVinculacion, setIdTipoVinculacion] = useState<number | null>(null);
  const [idTipoContrato, setIdTipoContrato] = useState<number | null>(null);

  useEffect(() => {
    if (clienteId && planillaId) {
      fetchPlanillaDetalles();
    }
  }, [clienteId, planillaId]);

  const fetchPlanillaDetalles = async () => {
    if (!clienteId || !planillaId) return;
  
    try {
      setLoading(true);
      const payload = {
        cliente_id: clienteId,
        action: 'leer',
        id_planilla: planillaId
      };
  
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      if (response.data && Array.isArray(response.data)) {
        const mappedData = response.data.map((detalle: any) => {
          const totalHorasExtrasHoras = (detalle.horas_extras || 0);
  
          const totalEmployeeDeductions = (detalle.salud_empleado || 0) +
                                          (detalle.pension_empleado || 0) +
                                          (detalle.embargo || 0) +
                                          (detalle.otros_descuentos || 0) +
                                          (detalle.prestamo_empresa || 0) +
                                          (detalle.retencion_en_la_fuente || 0);
  
          const salarioPorDia = detalle.salario_base / 30;
          const salarioPorDiasTrabajados = salarioPorDia * (detalle.dias_a_pagar || 0);
          const totalHorasExtrasValue = (detalle.diurna || 0) +
                                        (detalle.nocturna || 0) +
                                        (detalle.diurna_festivo || 0) +
                                        (detalle.nocturna_festivo || 0);
          const totalIngresos = salarioPorDiasTrabajados +
                                (detalle.auxilio || 0) +
                                totalHorasExtrasValue +
                                (detalle.recargo_nocturno || 0);
          const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);
  
          return {
            ...detalle,
            valor_total_horas_extras: totalHorasExtrasValue, // Update this to reflect the sum
            horas_extras: totalHorasExtrasHoras,
            pago_neto: pagoNeto,
            salud_empleado: detalle.salud_empleado || 0,
            pension_empleado: detalle.pension_empleado || 0,
            embargo: detalle.embargo || 0,
            otros_descuentos: detalle.otros_descuentos || 0,
            prestamo_empresa: detalle.prestamo_empresa || 0,
            retencion_en_la_fuente: detalle.retencion_en_la_fuente || 0,
            salud_empleador: detalle.salud_empleador || 0,
            pension_empleador: detalle.pension_empleador || 0,
            sena_empleador: detalle.sena_empleador || 0,
            ICBF: detalle.ICBF || 0,
            caja_compensacion_familiar: detalle.caja_compensacion_familiar || 0,
            cesantias: detalle.cesantias || 0,
            prima_servicios: detalle.prima_servicios || 0,
            vacaciones: detalle.vacaciones || 0,
            riesgos_laborales: detalle.riesgos_laborales || 0,
            diurna: detalle.diurna || 0,
            nocturna: detalle.nocturna || 0,
            diurna_festivo: detalle.diurna_festivo || 0,
            nocturna_festivo: detalle.nocturna_festivo || 0,
            total_deducciones: totalEmployeeDeductions,
          };
        });
        setPlanillaDetalles(mappedData);
      } else {
        setPlanillaDetalles([]);
      }
    } catch (err: any) {
      setPlanillaDetalles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogosDetalle = async () => {
    if (!clienteId) return;

    try {
      setLoadingCatalogos(true);

      const personasPayload = { cliente_id: clienteId, action: 'leer_personas' };
      const personasResponse = await axios.post(PLANILLA_DETALLE_API_URL, personasPayload);
      setPersonas(personasResponse.data && Array.isArray(personasResponse.data) ? personasResponse.data : []);

      const tiposPagoPayload = { cliente_id: clienteId, action: 'leer_tipos_pago' };
      const tiposPagoResponse = await axios.post(PLANILLA_DETALLE_API_URL, tiposPagoPayload);
      setTiposPago(tiposPagoResponse.data && Array.isArray(tiposPagoResponse.data) ? tiposPagoResponse.data : []);
    } catch (err: any) {
      console.error('Error al cargar catálogos para detalles:', err);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const fetchContratosPorPersona = async (personaId: number) => {
    if (!clienteId || !personaId) {
      setContratos([]);
      return;
    }

    try {
      setLoadingCatalogos(true);
      const payload = { cliente_id: clienteId, action: 'leer_contratos', id_persona: personaId };
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);

      if (response.data && Array.isArray(response.data)) {
        setContratos(response.data);
      } else {
        setContratos([]);
      }
    } catch (err: any) {
      setContratos([]);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const fetchContratoDetails = async (contratoId: number, personaId: number) => {
    if (!clienteId || !personaId || !contratoId) return;

    try {
      const payload = { cliente_id: clienteId, action: 'leer', id_persona: personaId };
      const response = await axios.post(CONTRATO_API_URL, payload);

      if (response.data && Array.isArray(response.data)) {
        const contratoSeleccionado = response.data.find(contrato => contrato.id === contratoId);
        if (contratoSeleccionado) {
          return contratoSeleccionado;
        }
      }
      return null;
    } catch (err) {
      console.error("Error al obtener detalles del contrato:", err);
      return null;
    }
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (['salario_base', 'dias_a_pagar', 'auxilio', 'valor_total_horas_extras', 'recargo_nocturno'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => {
        const newData = { ...prev, [name]: numValue };
        const salarioBase = name === 'salario_base' ? numValue : prev.salario_base;
        const diasAPagar = name === 'dias_a_pagar' ? numValue : prev.dias_a_pagar;
        const auxilio = name === 'auxilio' ? numValue : prev.auxilio;
        const valorTotalHorasExtras = name === 'valor_total_horas_extras' ? numValue : prev.valor_total_horas_extras;
        const recargoNocturno = name === 'recargo_nocturno' ? numValue : prev.recargo_nocturno;

        const saludEmpleado = salarioBase * 0.04;
        const pensionEmpleado = salarioBase * 0.04;
        const totalEmployeeDeductions = saludEmpleado +
                                        pensionEmpleado +
                                        (prev.embargo || 0) +
                                        (prev.otros_descuentos || 0) +
                                        (prev.prestamo_empresa || 0) +
                                        (prev.retencion_en_la_fuente || 0);

        const salarioPorDia = salarioBase / 30;
        const salarioPorDiasTrabajados = salarioPorDia * diasAPagar;
        const totalIngresos = salarioPorDiasTrabajados + auxilio + valorTotalHorasExtras + recargoNocturno;
        const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);

        return { 
          ...newData, 
          salud_empleado: saludEmpleado,
          pension_empleado: pensionEmpleado,
          pago_neto: pagoNeto 
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAuxilioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'si' | 'no';
    setRequiereAuxilio(value);

    setFormData(prev => {
      const newAuxilio = value === 'si' ? VALOR_AUXILIO_TRANSPORTE : 0;
      const salarioPorDia = prev.salario_base / 30;
      const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;

      const totalEmployeeDeductions = (prev.salud_empleado || 0) +
                                      (prev.pension_empleado || 0) +
                                      (prev.embargo || 0) +
                                      (prev.otros_descuentos || 0) +
                                      (prev.prestamo_empresa || 0) +
                                      (prev.retencion_en_la_fuente || 0);

      const totalIngresos = salarioPorDiasTrabajados + newAuxilio + prev.valor_total_horas_extras + prev.recargo_nocturno;
      const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);

      return { ...prev, auxilio: newAuxilio, pago_neto: pagoNeto };
    });
  };

  const handleEditHoraExtra = (tipo: string, horas: number) => {
    setEditHoraExtra(tipo);
    setEditHorasValue(horas);
  };

  const handleEditRecargoNocturno = (tipo: string, horas: number) => {
    setEditRecargoNocturno(tipo);
    setEditHorasValue(horas);
  };

  const handleEditDeduccion = (tipo: string, porcentaje: number) => {
    setEditDeduccion(tipo);
    setEditDeduccionValue(porcentaje * 100);
  };

  const handleSaveEditHoraExtra = () => {
    if (editHoraExtra) {
      setHorasExtrasData(prev => ({ ...prev, [editHoraExtra]: editHorasValue }));
    }
    setEditHoraExtra(null);
    setEditHorasValue(0);
  };

  const handleSaveEditRecargoNocturno = () => {
    if (editRecargoNocturno) {
      let numValue = editHorasValue;
      if (numValue > MAX_HORAS_NOCTURNAS_MENSUAL) {
        numValue = MAX_HORAS_NOCTURNAS_MENSUAL;
      }
      setRecargosNocturnosData(prev => ({ ...prev, [editRecargoNocturno]: numValue }));
    }
    setEditRecargoNocturno(null);
    setEditHorasValue(0);
  };

  const handleSaveEditDeduccion = () => {
    if (editDeduccion) {
      const porcentaje = editDeduccionValue / 100;
      setDeduccionesData(prev => ({ ...prev, [editDeduccion]: porcentaje }));
    }
    setEditDeduccion(null);
    setEditDeduccionValue(0);
  };

  const calculateHoraExtraValue = (tipo: string, horas: number) => {
    const salarioPorHora = (formData.salario_base / 30) / 8;
    const horaExtra = TIPOS_HORAS_EXTRAS.find(h => h.tipo === tipo);
    if (horaExtra) {
      const valorHoraExtra = salarioPorHora * (1 + horaExtra.recargo);
      return Math.round(horas * valorHoraExtra);
    }
    return 0;
  };

  const calculateRecargoNocturnoValue = (tipo: string, horas: number) => {
    const salarioPorHora = (formData.salario_base / 30) / 8;
    const recargo = RECARGOS_NOCTURNOS.find(r => r.tipo === tipo);
    if (recargo) {
      const valorRecargoNocturno = salarioPorHora * recargo.recargo;
      return Math.round(horas * valorRecargoNocturno);
    }
    return 0;
  };

  const calculateDeduccionValue = (tipo: string, porcentaje: number) => {
    const salarioBase = formData.salario_base;
    return Math.round(salarioBase * porcentaje);
  };

  const calculateTotalHorasExtrasHoras = () => {
    return TIPOS_HORAS_EXTRAS.reduce((sum, { tipo }) => {
      const horas = horasExtrasData[tipo] || 0;
      return sum + horas;
    }, 0);
  };

  const calculateTotalIngresos = () => {
    const totalHorasExtras = TIPOS_HORAS_EXTRAS.reduce((sum, { tipo }) => {
      const horas = horasExtrasData[tipo] || 0;
      return sum + calculateHoraExtraValue(tipo, horas);
    }, 0);

    const totalRecargosNocturnos = RECARGOS_NOCTURNOS.reduce((sum, { tipo }) => {
      const horas = recargosNocturnosData[tipo] || 0;
      return sum + calculateRecargoNocturnoValue(tipo, horas);
    }, 0);

    const salarioPorDia = formData.salario_base / 30;
    const salarioPorDiasTrabajados = salarioPorDia * formData.dias_a_pagar;
    return Math.round(salarioPorDiasTrabajados + formData.auxilio + totalHorasExtras + totalRecargosNocturnos);
  };

  const calculateTotalObligacionEmpleado = () => {
    const saludEmpleado = calculateDeduccionValue('Salud Empleado', deduccionesData['Salud Empleado']);
    const pensionEmpleado = calculateDeduccionValue('Pensión Empleado', deduccionesData['Pensión Empleado']);
    const embargo = calculateDeduccionValue('Embargo', deduccionesData['Embargo']);
    const otrosDescuentos = calculateDeduccionValue('Otros Descuentos', deduccionesData['Otros Descuentos']);
    const prestamoEmpresa = calculateDeduccionValue('Préstamo Empresa', deduccionesData['Préstamo Empresa']);
    const retencionEnLaFuente = calculateDeduccionValue('Retención en la Fuente', deduccionesData['Retención en la Fuente']);
    
    return saludEmpleado + pensionEmpleado + embargo + otrosDescuentos + prestamoEmpresa + retencionEnLaFuente;
  };

  const calculateTotalObligacionEmpleador = () => {
    const saludEmpleador = calculateDeduccionValue('Salud Empleador', deduccionesData['Salud Empleador']);
    const pensionEmpleador = calculateDeduccionValue('Pensión Empleador', deduccionesData['Pensión Empleador']);
    const senaEmpleador = calculateDeduccionValue('SENA Empleador', deduccionesData['SENA Empleador']);
    const icbf = calculateDeduccionValue('ICBF', deduccionesData['ICBF']);
    const cajaCompensacion = calculateDeduccionValue('Caja Compensación Familiar', deduccionesData['Caja Compensación Familiar']);
    const cesantias = calculateDeduccionValue('Cesantías', deduccionesData['Cesantías']);
    const primaServicios = calculateDeduccionValue('Prima de Servicios', deduccionesData['Prima de Servicios']);
    const vacaciones = calculateDeduccionValue('Vacaciones', deduccionesData['Vacaciones']);
    const riesgosLaborales = calculateDeduccionValue('Riesgos Laborales', deduccionesData['Riesgos Laborales']);
    
    return saludEmpleador + pensionEmpleador + senaEmpleador + icbf + cajaCompensacion + cesantias + primaServicios + vacaciones + riesgosLaborales;
  };

  const handleSaveNovedades = () => {
    try {
      const totalHorasExtrasHoras = calculateTotalHorasExtrasHoras();

      const totalHorasExtras = TIPOS_HORAS_EXTRAS.reduce((sum, { tipo }) => {
        const horas = horasExtrasData[tipo] || 0;
        return sum + calculateHoraExtraValue(tipo, horas);
      }, 0);

      const diurnaValue = calculateHoraExtraValue('Diurna', horasExtrasData['Diurna'] || 0);
      const nocturnaValue = calculateHoraExtraValue('Nocturna', horasExtrasData['Nocturna'] || 0);
      const diurnaFestivoValue = calculateHoraExtraValue('Diurna en Domingo/Festivo', horasExtrasData['Diurna en Domingo/Festivo'] || 0);
      const nocturnaFestivoValue = calculateHoraExtraValue('Nocturna en Domingo/Festivo', horasExtrasData['Nocturna en Domingo/Festivo'] || 0);

      const recargoNocturno = calculateRecargoNocturnoValue('Recargo Nocturno', recargosNocturnosData['Recargo Nocturno'] || 0);

      setFormData(prev => {
        const saludEmpleado = calculateDeduccionValue('Salud Empleado', deduccionesData['Salud Empleado']);
        const pensionEmpleado = calculateDeduccionValue('Pensión Empleado', deduccionesData['Pensión Empleado']);
        const embargo = calculateDeduccionValue('Embargo', deduccionesData['Embargo']);
        const otrosDescuentos = calculateDeduccionValue('Otros Descuentos', deduccionesData['Otros Descuentos']);
        const prestamoEmpresa = calculateDeduccionValue('Préstamo Empresa', deduccionesData['Préstamo Empresa']);
        const retencionEnLaFuente = calculateDeduccionValue('Retención en la Fuente', deduccionesData['Retención en la Fuente']);
        const saludEmpleador = calculateDeduccionValue('Salud Empleador', deduccionesData['Salud Empleador']);
        const pensionEmpleador = calculateDeduccionValue('Pensión Empleador', deduccionesData['Pensión Empleador']);
        const senaEmpleador = calculateDeduccionValue('SENA Empleador', deduccionesData['SENA Empleador']);
        const icbf = calculateDeduccionValue('ICBF', deduccionesData['ICBF']);
        const cajaCompensacion = calculateDeduccionValue('Caja Compensación Familiar', deduccionesData['Caja Compensación Familiar']);
        const cesantias = calculateDeduccionValue('Cesantías', deduccionesData['Cesantías']);
        const primaServicios = calculateDeduccionValue('Prima de Servicios', deduccionesData['Prima de Servicios']);
        const vacaciones = calculateDeduccionValue('Vacaciones', deduccionesData['Vacaciones']);
        const riesgosLaborales = calculateDeduccionValue('Riesgos Laborales', deduccionesData['Riesgos Laborales']);

        const totalEmployeeDeductions = saludEmpleado + pensionEmpleado + embargo + otrosDescuentos + prestamoEmpresa + retencionEnLaFuente;

        const salarioPorDia = prev.salario_base / 30;
        const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
        const totalIngresos = salarioPorDiasTrabajados + prev.auxilio + totalHorasExtras + recargoNocturno;
        const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);

        return {
          ...prev,
          horas_extras: totalHorasExtrasHoras,
          valor_total_horas_extras: totalHorasExtras,
          recargo_nocturno: recargoNocturno,
          recargos_nocturnos: 0,
          salud_empleado: saludEmpleado,
          salud_empleador: saludEmpleador,
          pension_empleado: pensionEmpleado,
          pension_empleador: pensionEmpleador,
          sena_empleador: senaEmpleador,
          ICBF: icbf,
          caja_compensacion_familiar: cajaCompensacion,
          cesantias: cesantias,
          prima_servicios: primaServicios,
          vacaciones: vacaciones,
          riesgos_laborales: riesgosLaborales,
          embargo: embargo,
          otros_descuentos: otrosDescuentos,
          prestamo_empresa: prestamoEmpresa,
          retencion_en_la_fuente: retencionEnLaFuente,
          pago_neto: pagoNeto,
          diurna: diurnaValue,
          nocturna: nocturnaValue,
          diurna_festivo: diurnaFestivoValue,
          nocturna_festivo: nocturnaFestivoValue,
        };
      });

      setNovedadesDialogOpen(false);
    } catch (err: any) {
      console.error('Error al guardar novedades:', err);
      setError('Error al guardar las novedades. Por favor, intenta de nuevo.');
    }
  };

  const handleSelectChange = async (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);

    setFormData(prev => ({ ...prev, [name]: numValue }));

    if (name === 'id_persona' && numValue > 0) {
      fetchContratosPorPersona(numValue);
    }

    if (name === 'id_contrato' && numValue > 0) {
      try {
        setLoadingCatalogos(true);
        const contratoSeleccionado = await fetchContratoDetails(numValue, formData.id_persona);

        if (contratoSeleccionado) {
          const salarioLimpio = typeof contratoSeleccionado.salario === 'string' 
            ? contratoSeleccionado.salario.replace(/[^\d.]/g, '')
            : contratoSeleccionado.salario;
          const salarioNumerico = parseFloat(String(salarioLimpio)) || 0;

          const idTipoVinculacionSeleccionado = contratoSeleccionado.id_tipo_vinculacion || 0;
          const idTipoContratoSeleccionado = contratoSeleccionado.id_tipo_contrato || 0;

          setIdTipoVinculacion(idTipoVinculacionSeleccionado);
          setIdTipoContrato(idTipoContratoSeleccionado);

          if (
            idTipoVinculacionSeleccionado === 2 ||
            idTipoContratoSeleccionado === 3 ||
            idTipoContratoSeleccionado === 5
          ) {
            setHorasExtrasData({
              'Diurna': 0,
              'Nocturna': 0,
              'Diurna en Domingo/Festivo': 0,
              'Nocturna en Domingo/Festivo': 0,
            });
            setRecargosNocturnosData({
              'Recargo Nocturno': 0,
            });

            setFormData(prev => {
              const saludEmpleado = salarioNumerico * 0.04;
              const pensionEmpleado = salarioNumerico * 0.04;
              const totalEmployeeDeductions = saludEmpleado + pensionEmpleado;
              const salarioPorDia = salarioNumerico / 30;
              const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
              const totalIngresos = salarioPorDiasTrabajados + prev.auxilio;
              const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);
              return {
                ...prev,
                salario_base: salarioNumerico,
                auxilio: prev.auxilio,
                valor_total_horas_extras: 0,
                horas_extras: 0,
                recargo_nocturno: 0,
                salud_empleado: saludEmpleado,
                pension_empleado: pensionEmpleado,
                embargo: 0,
                otros_descuentos: 0,
                prestamo_empresa: 0,
                retencion_en_la_fuente: 0,
                pago_neto: pagoNeto,
                diurna: 0,
                nocturna: 0,
                diurna_festivo: 0,
                nocturna_festivo: 0,
              };
            });
          } else {
            setFormData(prev => {
              const saludEmpleado = salarioNumerico * 0.04;
              const pensionEmpleado = salarioNumerico * 0.04;
              const totalEmployeeDeductions = saludEmpleado +
                                              pensionEmpleado +
                                              (prev.embargo || 0) +
                                              (prev.otros_descuentos || 0) +
                                              (prev.prestamo_empresa || 0) +
                                              (prev.retencion_en_la_fuente || 0);
              const salarioPorDia = salarioNumerico / 30;
              const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
              const totalIngresos = salarioPorDiasTrabajados + prev.auxilio + prev.valor_total_horas_extras + prev.recargo_nocturno;
              const pagoNeto = Math.round(totalIngresos - totalEmployeeDeductions);
              return {
                ...prev,
                salario_base: salarioNumerico,
                salud_empleado: saludEmpleado,
                pension_empleado: pensionEmpleado,
                pago_neto: pagoNeto,
              };
            });
          }
        }
      } catch (err) {
        console.error("Error al obtener detalles del contrato:", err);
      } finally {
        setLoadingCatalogos(false);
      }
    }
  };

  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      id_planilla: planillaId,
      id_persona: 0,
      salario_base: 0,
      dias_a_pagar: 30,
      auxilio: 0,
      valor_total_horas_extras: 0,
      horas_extras: 0,
      recargos_nocturnos: 0,
      recargo_nocturno: 0,
      pago_neto: 0,
      id_contrato: 0,
      id_tipo_pago: 0,
      salud_empleado: 0,
      pension_empleado: 0,
      embargo: 0,
      otros_descuentos: 0,
      prestamo_empresa: 0,
      retencion_en_la_fuente: 0,
      salud_empleador: 0,
      pension_empleador: 0,
      sena_empleador: 0,
      ICBF: 0,
      caja_compensacion_familiar: 0,
      cesantias: 0,
      prima_servicios: 0,
      vacaciones: 0,
      riesgos_laborales: 0,
      diurna: 0,
      nocturna: 0,
      diurna_festivo: 0,
      nocturna_festivo: 0,
    });
    setRequiereAuxilio('no');
    setHorasExtrasData({
      'Diurna': 0,
      'Nocturna': 0,
      'Diurna en Domingo/Festivo': 0,
      'Nocturna en Domingo/Festivo': 0,
    });
    setRecargosNocturnosData({
      'Recargo Nocturno': 0,
    });
    setDeduccionesData({
      'Salud Empleado': 0.04,
      'Salud Empleador': 0.085,
      'Pensión Empleado': 0.04,
      'Pensión Empleador': 0.12,
      'SENA Empleador': 0.02,
      'ICBF': 0.03,
      'Caja Compensación Familiar': 0.04,
      'Cesantías': 0.0833,
      'Prima de Servicios': 0.0833,
      'Vacaciones': 0.0417,
      'Riesgos Laborales': 0,
      'Embargo': 0,
      'Otros Descuentos': 0,
      'Préstamo Empresa': 0,
      'Retención en la Fuente': 0,
    });
    setIdTipoVinculacion(null);
    setIdTipoContrato(null);
    fetchCatalogosDetalle();
    setContratos([]);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = async (detalle: PlanillaDetalleData) => {
    setFormMode('editar');
    setFormData({
      ...detalle,
      diurna: detalle.diurna || 0,
      nocturna: detalle.nocturna || 0,
      diurna_festivo: detalle.diurna_festivo || 0,
      nocturna_festivo: detalle.nocturna_festivo || 0,
      horas_extras: detalle.horas_extras || 0,
    });
    setRequiereAuxilio(detalle.auxilio > 0 ? 'si' : 'no');

    const salarioPorHora = (detalle.salario_base / 30) / 8;
    const getHorasFromValue = (tipo: string, valor: number) => {
      const horaExtra = TIPOS_HORAS_EXTRAS.find(h => h.tipo === tipo);
      if (horaExtra && valor > 0) {
        const valorHoraExtra = salarioPorHora * (1 + horaExtra.recargo);
        return Math.round(valor / valorHoraExtra);
      }
      return 0;
    };

    setHorasExtrasData({
      'Diurna': getHorasFromValue('Diurna', detalle.diurna || 0),
      'Nocturna': getHorasFromValue('Nocturna', detalle.nocturna || 0),
      'Diurna en Domingo/Festivo': getHorasFromValue('Diurna en Domingo/Festivo', detalle.diurna_festivo || 0),
      'Nocturna en Domingo/Festivo': getHorasFromValue('Nocturna en Domingo/Festivo', detalle.nocturna_festivo || 0),
    });

    setRecargosNocturnosData({
      'Recargo Nocturno': detalle.recargo_nocturno ? Math.ceil(detalle.recargo_nocturno / calculateRecargoNocturnoValue('Recargo Nocturno', 1)) : 0,
    });

    setDeduccionesData({
      'Salud Empleado': detalle.salud_empleado ? detalle.salud_empleado / detalle.salario_base : 0.04,
      'Salud Empleador': detalle.salud_empleador ? detalle.salud_empleador / detalle.salario_base : 0.085,
      'Pensión Empleado': detalle.pension_empleado ? detalle.pension_empleado / detalle.salario_base : 0.04,
      'Pensión Empleador': detalle.pension_empleador ? detalle.pension_empleador / detalle.salario_base : 0.12,
      'SENA Empleador': detalle.sena_empleador ? detalle.sena_empleador / detalle.salario_base : 0.02,
      'ICBF': detalle.ICBF ? detalle.ICBF / detalle.salario_base : 0.03,
      'Caja Compensación Familiar': detalle.caja_compensacion_familiar ? detalle.caja_compensacion_familiar / detalle.salario_base : 0.04,
      'Cesantías': detalle.cesantias ? detalle.cesantias / detalle.salario_base : 0.0833,
      'Prima de Servicios': detalle.prima_servicios ? detalle.prima_servicios / detalle.salario_base : 0.0833,
      'Vacaciones': detalle.vacaciones ? detalle.vacaciones / detalle.salario_base : 0.0417,
      'Riesgos Laborales': detalle.riesgos_laborales ? detalle.riesgos_laborales / detalle.salario_base : 0,
      'Embargo': detalle.embargo ? detalle.embargo / detalle.salario_base : 0,
      'Otros Descuentos': detalle.otros_descuentos ? detalle.otros_descuentos / detalle.salario_base : 0,
      'Préstamo Empresa': detalle.prestamo_empresa ? detalle.prestamo_empresa / detalle.salario_base : 0,
      'Retención en la Fuente': detalle.retencion_en_la_fuente ? detalle.retencion_en_la_fuente / detalle.salario_base : 0,
    });

    fetchCatalogosDetalle();
    if (detalle.id_persona) {
      fetchContratosPorPersona(detalle.id_persona);
    }

    if (detalle.id_contrato && detalle.id_persona) {
      const contratoSeleccionado = await fetchContratoDetails(detalle.id_contrato, detalle.id_persona);
      if (contratoSeleccionado) {
        setIdTipoVinculacion(contratoSeleccionado.id_tipo_vinculacion || null);
        setIdTipoContrato(contratoSeleccionado.id_tipo_contrato || null);
      } else {
        setIdTipoVinculacion(null);
        setIdTipoContrato(null);
      }
    } else {
      setIdTipoVinculacion(null);
      setIdTipoContrato(null);
    }

    setDialogOpen(true);
  };

  const handleSaveDetalle = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requiredFields = ['id_planilla', 'id_persona', 'salario_base', 'dias_a_pagar', 'id_contrato', 'id_tipo_pago'];
      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      const payload = {
        cliente_id: clienteId,
        action: formMode === 'editar' ? 'modificar' : 'crear',
        id: formMode === 'editar' ? formData.id : undefined,
        id_planilla: formData.id_planilla,
        id_persona: formData.id_persona,
        salario_base: formData.salario_base,
        dias_a_pagar: formData.dias_a_pagar,
        auxilio: formData.auxilio,
        valor_total_horas_extras: formData.valor_total_horas_extras,
        horas_extras: formData.horas_extras,
        recargo_nocturno: formData.recargo_nocturno,
        recargos_nocturnos: formData.recargos_nocturnos,
        pago_neto: formData.pago_neto,
        id_contrato: formData.id_contrato,
        id_tipo_pago: formData.id_tipo_pago,
        salud_empleado: formData.salud_empleado,
        salud_empleador: formData.salud_empleador,
        pension_empleado: formData.pension_empleado,
        pension_empleador: formData.pension_empleador,
        sena_empleador: formData.sena_empleador,
        ICBF: formData.ICBF,
        caja_compensacion_familiar: formData.caja_compensacion_familiar,
        cesantias: formData.cesantias,
        prima_servicios: formData.prima_servicios,
        vacaciones: formData.vacaciones,
        riesgos_laborales: formData.riesgos_laborales,
        embargo: formData.embargo,
        otros_descuentos: formData.otros_descuentos,
        prestamo_empresa: formData.prestamo_empresa,
        retencion_en_la_fuente: formData.retencion_en_la_fuente,
        diurna: formData.diurna,
        nocturna: formData.nocturna,
        diurna_festivo: formData.diurna_festivo,
        nocturna_festivo: formData.nocturna_festivo,
      };

      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);

      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'editar' ? 'Detalle actualizado exitosamente' : 'Detalle creado exitosamente');
        setDialogOpen(false);
        fetchPlanillaDetalles();
      }
    } catch (err: any) {
      console.error('Error al guardar detalle:', err);
      setError(err.response?.data?.error || `Error al ${formMode === 'editar' ? 'actualizar' : 'crear'} el detalle`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDetalle = async (id: number) => {
    if (!clienteId) return;

    if (!window.confirm('¿Estás seguro de que deseas eliminar este detalle de planilla?')) return;

    try {
      setLoading(true);
      const payload = { cliente_id: clienteId, action: 'eliminar', id: id };
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);

      if (response.status === 200) {
        setSuccess('Detalle eliminado exitosamente');
        fetchPlanillaDetalles();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el detalle');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const puedeRecibirAuxilioHorasExtrasRecargos = () => {
    return (
      idTipoVinculacion !== 2 &&
      idTipoContrato !== 3 &&
      idTipoContrato !== 5
    );
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#f8f8f8' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Detalles de la planilla</Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Agregar Pago
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : planillaDetalles.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ p: 2 }}>
          No hay detalles de pago registrados para esta planilla
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Tipo de Pago</TableCell>
                <TableCell align="right">Salario Base</TableCell>
                <TableCell align="right">Días a Pagar</TableCell>
                <TableCell align="right">Auxilio</TableCell>
                <TableCell align="right">Horas Extras</TableCell>
                <TableCell align="right">Recargo Noc.</TableCell>
                <TableCell align="right">Total Deducciones</TableCell>
                <TableCell align="right">Pago Neto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planillaDetalles.map((detalle) => {
                const totalEmployeeDeductions = (detalle.salud_empleado || 0) +
                                                (detalle.pension_empleado || 0) +
                                                (detalle.embargo || 0) +
                                                (detalle.otros_descuentos || 0) +
                                                (detalle.prestamo_empresa || 0) +
                                                (detalle.retencion_en_la_fuente || 0);
                return (
                  <TableRow key={detalle.id}>
                    <TableCell>{detalle.nombre_completo || `ID: ${detalle.id_persona}`}</TableCell>
                    <TableCell>{detalle.tipo_pago_nombre || `ID: ${detalle.id_tipo_pago}`}</TableCell>
                    <TableCell align="right">{formatMoney(detalle.salario_base)}</TableCell>
                    <TableCell align="right">{detalle.dias_a_pagar}</TableCell>
                    <TableCell align="right">{formatMoney(detalle.auxilio)}</TableCell>
                    <TableCell align="right">{detalle.horas_extras}</TableCell>
                    <TableCell align="right">{formatMoney(detalle.recargo_nocturno || 0)}</TableCell>
                    <TableCell align="right">{formatMoney(totalEmployeeDeductions)}</TableCell>
                    <TableCell align="right">{formatMoney(detalle.pago_neto)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEditDialog(detalle)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => detalle.id && handleDeleteDetalle(detalle.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === 'crear' ? 'Agregar Pago a la Planilla' : 'Editar Pago'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Empleado</InputLabel>
              <Select
                name="id_persona"
                value={String(formData.id_persona || '')}
                onChange={handleSelectChange}
                label="Empleado"
              >
                <MenuItem value=""><em>Seleccione</em></MenuItem>
                {personas.map(persona => (
                  <MenuItem key={persona.id} value={String(persona.id)}>
                    {persona.nombre_completo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Contrato</InputLabel>
              <Select
                name="id_contrato"
                value={String(formData.id_contrato || '')}
                onChange={handleSelectChange}
                label="Contrato"
                disabled={!formData.id_persona}
              >
                <MenuItem value=""><em>Seleccione un empleado primero</em></MenuItem>
                {contratos.map(contrato => (
                  <MenuItem key={contrato.id} value={String(contrato.id)}>
                    {contrato.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                name="id_tipo_pago"
                value={String(formData.id_tipo_pago || '')}
                onChange={handleSelectChange}
                label="Tipo de Pago"
              >
                <MenuItem value=""><em>Seleccione</em></MenuItem>
                {tiposPago.map(tipo => (
                  <MenuItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Salario Base"
              name="salario_base"
              type="number"
              value={formData.salario_base}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              label="Días a Pagar"
              name="dias_a_pagar"
              type="number"
              value={formData.dias_a_pagar}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
              InputProps={{ inputProps: { min: 0, max: 30 } }}
            />

            {!puedeRecibirAuxilioHorasExtrasRecargos() && (
              <Typography variant="body2" color="textSecondary" sx={{ gridColumn: '1 / span 2', my: 1 }}>
                Los conceptos de auxilio, horas extras y recargos nocturnos no aplican para este tipo de contrato o vinculación.
              </Typography>
            )}

            {puedeRecibirAuxilioHorasExtrasRecargos() && formData.salario_base > 0 && formData.salario_base < UMBRAL_AUXILIO_TRANSPORTE && (
              <FormControl component="fieldset" sx={{ gridColumn: '1 / span 2', my: 1 }}>
                <FormLabel component="legend">¿El empleado requiere auxilio?</FormLabel>
                <RadioGroup
                  row
                  name="requiere_auxilio"
                  value={requiereAuxilio}
                  onChange={handleAuxilioChange}
                >
                  <FormControlLabel value="si" control={<Radio />} label="Sí" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            )}

            {(requiereAuxilio === 'si' || formData.auxilio > 0) && puedeRecibirAuxilioHorasExtrasRecargos() && (
              <TextField
                label="Auxilio de Transporte"
                name="auxilio"
                type="number"
                value={formData.auxilio}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            )}

            {puedeRecibirAuxilioHorasExtrasRecargos() && (
              <Box sx={{ gridColumn: '1 / span 2', my: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EventNoteIcon />}
                  onClick={() => setNovedadesDialogOpen(true)}
                >
                  Novedades
                </Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Horas Extras"
                name="valor_total_horas_extras"
                type="number"
                value={formData.valor_total_horas_extras}
                fullWidth
                variant="outlined"
                disabled
                InputProps={{
                  startAdornment: '$',
                }}
              />
              <TextField
                label="Total Horas"
                type="number"
                value={calculateTotalHorasExtrasHoras()}
                fullWidth
                variant="outlined"
                disabled
              />
            </Box>

            <TextField
              label="Recargo Nocturno"
              name="recargo_nocturno"
              type="number"
              value={formData.recargo_nocturno}
              fullWidth
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: '$',
              }}
            />

            <TextField
              label="Total Pago"
              type="number"
              value={calculateTotalIngresos()}
              fullWidth
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: '$',
              }}
            />

            <TextField
              label="Deducciones (Obligación Empleado)"
              type="number"
              value={calculateTotalObligacionEmpleado()}
              fullWidth
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: '$',
              }}
            />

            <TextField
              label="Pago Neto"
              type="number"
              value={formData.pago_neto}
              fullWidth
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSaveDetalle} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={novedadesDialogOpen} onClose={() => setNovedadesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novedades</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
            <Tab label="Ingresos" />
            <Tab label="Deducciones" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                background: 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)', 
                p: 2, 
                borderRadius: 2, 
                mb: 2, 
                borderBottom: '2px solid #1976d2' 
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Horas Extras
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {TIPOS_HORAS_EXTRAS.map(({ tipo, horario, recargo, descripcion }) => {
                  const horas = horasExtrasData[tipo] || 0;
                  const valor = calculateHoraExtraValue(tipo, horas);
                  const tooltipContent = `Descripción: ${descripcion}\nHorario: ${horario}\nRecargo: ${(recargo * 100).toFixed(0)}%`;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={tipo}>
                      <Card sx={{ 
                        minHeight: 180, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        boxShadow: 3,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        }
                      }}>
                        <Box
                          sx={{
                            background: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
                            color: 'white',
                            p: 2,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontSize: tipo.length > 15 ? '1rem' : '1.25rem', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis' 
                            }}
                          >
                            {tipo}
                          </Typography>
                          <Tooltip title={tooltipContent} arrow>
                            <IconButton sx={{ color: 'white' }}>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <CardContent>
                          <Typography variant="body2" color="textSecondary">Horas: {horas}</Typography>
                          <Typography variant="body2" color="textSecondary">Valor: {formatMoney(valor)}</Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          <IconButton onClick={() => handleEditHoraExtra(tipo, horas)}>
                            <EditIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ 
                background: 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)', 
                p: 2, 
                borderRadius: 2, 
                mb: 2, 
                mt: 3, 
                borderBottom: '2px solid #1976d2' 
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Recargos Nocturnos
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {RECARGOS_NOCTURNOS.map(({ tipo, horario, recargo, descripcion }) => {
                  const horas = recargosNocturnosData[tipo] || 0;
                  const valor = calculateRecargoNocturnoValue(tipo, horas);
                  const tooltipContent = `Descripción: ${descripcion}\nHorario: ${horario}\nRecargo: ${(recargo * 100).toFixed(0)}%`;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={tipo}>
                      <Card sx={{ 
                        minHeight: 180, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        boxShadow: 3,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        }
                      }}>
                        <Box
                          sx={{
                            background: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
                            color: 'white',
                            p: 2,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontSize: tipo.length > 15 ? '1rem' : '1.25rem', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis' 
                            }}
                          >
                            {tipo}
                          </Typography>
                          <Tooltip title={tooltipContent} arrow>
                            <IconButton sx={{ color: 'white' }}>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <CardContent>
                          <Typography variant="body2" color="textSecondary">Horas: {horas}</Typography>
                          <Typography variant="body2" color="textSecondary">Valor: {formatMoney(valor)}</Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          <IconButton onClick={() => handleEditRecargoNocturno(tipo, horas)}>
                            <EditIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#e0f7fa', borderRadius: 1 }}>
                <Typography variant="h6">Total Ingresos: {formatMoney(calculateTotalIngresos())}</Typography>
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                background: 'linear-gradient(45deg, #ffebee 30%, #ffcdd2 90%)', 
                p: 2, 
                borderRadius: 2, 
                mb: 2, 
                borderBottom: '2px solid #d32f2f' 
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  Deducciones
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {DEDUCCIONES.map(({ tipo, porcentaje, descripcion, editable }) => {
                  const porcentajeActual = deduccionesData[tipo] || porcentaje;
                  const valor = calculateDeduccionValue(tipo, porcentajeActual);
                  const tooltipContent = `Descripción: ${descripcion}\nPorcentaje: ${(porcentajeActual * 100).toFixed(2)}%`;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={tipo}>
                      <Card sx={{ 
                        minHeight: 180, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        boxShadow: 3,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        }
                      }}>
                        <Box
                          sx={{
                            background: 'linear-gradient(45deg, #ef5350 30%, #d32f2f 90%)',
                            color: 'white',
                            p: 2,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontSize: tipo.length > 15 ? '1rem' : '1.25rem', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis' 
                            }}
                          >
                            {tipo}
                          </Typography>
                          <Tooltip title={tooltipContent} arrow>
                            <IconButton sx={{ color: 'white' }}>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <CardContent>
                          <Typography variant="body2" color="textSecondary">Porcentaje: {(porcentajeActual * 100).toFixed(2)}%</Typography>
                          <Typography variant="body2" color="textSecondary">Valor: {formatMoney(valor)}</Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          {editable ? (
                            <IconButton onClick={() => handleEditDeduccion(tipo, porcentajeActual)}>
                              <EditIcon />
                            </IconButton>
                          ) : (
                            <IconButton disabled>
                              <EditIcon />
                            </IconButton>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                <Typography variant="h6">Total Obligación Empleado: {formatMoney(calculateTotalObligacionEmpleado())}</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Total Obligación Empleador: {formatMoney(calculateTotalObligacionEmpleador())}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f8e9', borderRadius: 1 }}>
            <Typography variant="h6">
              Total Novedades: {formatMoney(calculateTotalIngresos() - calculateTotalObligacionEmpleado())}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNovedadesDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNovedades}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editHoraExtra} onClose={() => setEditHoraExtra(null)}>
        <DialogTitle>Editar Horas Extras - {editHoraExtra}</DialogTitle>
        <DialogContent>
          <TextField
            label="Horas"
            type="number"
            value={editHorasValue}
            onChange={(e) => setEditHorasValue(Number(e.target.value))}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditHoraExtra(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveEditHoraExtra} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRecargoNocturno} onClose={() => setEditRecargoNocturno(null)}>
        <DialogTitle>Editar Recargo Nocturno - {editRecargoNocturno}</DialogTitle>
        <DialogContent>
          <TextField
            label="Horas"
            type="number"
            value={editHorasValue}
            onChange={(e) => setEditHorasValue(Number(e.target.value))}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            InputProps={{ inputProps: { min: 0, max: MAX_HORAS_NOCTURNAS_MENSUAL } }}
            helperText={`Máximo ${MAX_HORAS_NOCTURNAS_MENSUAL} horas al mes (${MAX_HORAS_NOCTURNAS_POR_DIA} horas por día)`}
          />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditRecargoNocturno(null)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSaveEditRecargoNocturno} color="primary" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for Editing Deducciones */}
        <Dialog open={!!editDeduccion} onClose={() => setEditDeduccion(null)}>
          <DialogTitle>Editar Deducción - {editDeduccion}</DialogTitle>
          <DialogContent>
            <TextField
              label="Porcentaje (%)"
              type="number"
              value={editDeduccionValue}
              onChange={(e) => setEditDeduccionValue(Number(e.target.value))}
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
              helperText="Ingrese el porcentaje (0-100)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDeduccion(null)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSaveEditDeduccion} color="primary" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  export default PlanillaDetalle;