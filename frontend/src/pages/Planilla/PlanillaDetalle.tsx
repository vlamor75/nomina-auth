import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlanillaDeducciones from './PlanillaDeducciones';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  IconButton, FormControlLabel, Switch, Radio, RadioGroup, FormLabel, FormGroup
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';

interface PlanillaDetalleData {
  id?: number;
  id_planilla: number;
  id_persona: number;
  salario_base: number;
  dias_a_pagar: number;
  auxilio: number;
  valor_total_horas_extras: number;
  recargos_nocturnos: number;
  pago_neto: number;
  id_contrato: number;
  id_tipo_pago: number;
  nombre_completo?: string;
  contrato_nombre?: string;
  tipo_pago_nombre?: string;
  id_tipo_vinculacion?: number;
  id_tipo_contrato?: number;
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
  { tipo: 'Hora Extra Diurna', horario: '6:00 a.m. - 9:00 p.m.', recargo: 0.25, descripcion: 'Trabajo adicional realizado durante el horario diurno.' },
  { tipo: 'Hora Extra Nocturna', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.75, descripcion: 'Trabajo suplementario realizado en horario nocturno.' },
  { tipo: 'Hora Extra Diurna en Domingo/Festivo', horario: '6:00 a.m. - 9:00 p.m.', recargo: 1.0, descripcion: 'Trabajo adicional en días festivos o domingos durante el horario diurno.' },
  { tipo: 'Hora Extra Nocturna en Domingo/Festivo', horario: '9:00 p.m. - 6:00 a.m.', recargo: 1.5, descripcion: 'Trabajo suplementario realizado en horario nocturno durante domingos o festivos.' },
];

const RECARGOS_NOCTURNOS = [
  { tipo: 'Recargo Nocturno', horario: '9:00 p.m. - 6:00 a.m.', recargo: 0.35, descripcion: 'Pago adicional por trabajar en horario nocturno, independientemente de que sean horas extras o no.' },
];

const MAX_HORAS_NOCTURNAS_POR_DIA = 9; // Máximo 9 horas por día (de 9:00 p.m. a 6:00 a.m.)
const MAX_HORAS_NOCTURNAS_MENSUAL = 270; // Máximo 9 horas por día * 30 días = 270 horas al mes

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
    recargos_nocturnos: 0,
    pago_neto: 0,
    id_contrato: 0,
    id_tipo_pago: 0
  });

  const [requiereAuxilio, setRequiereAuxilio] = useState<'si' | 'no'>('no');
  const [requiereHorasExtras, setRequiereHorasExtras] = useState<'si' | 'no'>('no');
  const [requiereRecargosNocturnos, setRequiereRecargosNocturnos] = useState<'si' | 'no'>('no');
  const [horasExtrasDialogOpen, setHorasExtrasDialogOpen] = useState(false);
  const [recargosNocturnosDialogOpen, setRecargosNocturnosDialogOpen] = useState(false);
  const [horasExtrasData, setHorasExtrasData] = useState<{ [key: string]: number }>({
    'Hora Extra Diurna': 0,
    'Hora Extra Nocturna': 0,
    'Hora Extra Diurna en Domingo/Festivo': 0,
    'Hora Extra Nocturna en Domingo/Festivo': 0,
  });
  const [recargosNocturnosData, setRecargosNocturnosData] = useState<{ [key: string]: number }>({
    'Recargo Nocturno': 0,
  });

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
        const mappedData = response.data.map((detalle: any) => ({
          ...detalle,
          valor_total_horas_extras: detalle.horas_extras || 0,
        }));
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
    if (['salario_base', 'dias_a_pagar', 'auxilio', 'valor_total_horas_extras', 'recargos_nocturnos'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => {
        const newData = { ...prev, [name]: numValue };
        const salarioBase = name === 'salario_base' ? numValue : prev.salario_base;
        const diasAPagar = name === 'dias_a_pagar' ? numValue : prev.dias_a_pagar;
        const auxilio = name === 'auxilio' ? numValue : prev.auxilio;
        const valorTotalHorasExtras = name === 'valor_total_horas_extras' ? numValue : prev.valor_total_horas_extras;
        const recargosNocturnos = name === 'recargos_nocturnos' ? numValue : prev.recargos_nocturnos;

        const salarioPorDia = salarioBase / 30;
        const salarioPorDiasTrabajados = salarioPorDia * diasAPagar;
        const pagoNeto = Math.round(salarioPorDiasTrabajados + auxilio + valorTotalHorasExtras + recargosNocturnos);

        return { ...newData, pago_neto: pagoNeto };
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
      const pagoNeto = Math.round(salarioPorDiasTrabajados + newAuxilio + prev.valor_total_horas_extras + prev.recargos_nocturnos);

      return { ...prev, auxilio: newAuxilio, pago_neto: pagoNeto };
    });
  };

  const handleHorasExtrasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'si' | 'no';
    setRequiereHorasExtras(value);

    if (value === 'no') {
      setHorasExtrasData({
        'Hora Extra Diurna': 0,
        'Hora Extra Nocturna': 0,
        'Hora Extra Diurna en Domingo/Festivo': 0,
        'Hora Extra Nocturna en Domingo/Festivo': 0,
      });
      setFormData(prev => {
        const salarioPorDia = prev.salario_base / 30;
        const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
        const pagoNeto = Math.round(salarioPorDiasTrabajados + prev.auxilio + 0 + prev.recargos_nocturnos);
        return { ...prev, valor_total_horas_extras: 0, pago_neto: pagoNeto };
      });
    } else {
      setHorasExtrasDialogOpen(true);
    }
  };

  const handleRecargosNocturnosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'si' | 'no';
    setRequiereRecargosNocturnos(value);

    if (value === 'no') {
      setRecargosNocturnosData({
        'Recargo Nocturno': 0,
      });
      setFormData(prev => {
        const salarioPorDia = prev.salario_base / 30;
        const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
        const pagoNeto = Math.round(salarioPorDiasTrabajados + prev.auxilio + prev.valor_total_horas_extras + 0);
        return { ...prev, recargos_nocturnos: 0, pago_neto: pagoNeto };
      });
    } else {
      setRecargosNocturnosDialogOpen(true);
    }
  };

  const handleHorasExtrasInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    setHorasExtrasData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleRecargosNocturnosInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numValue = value === '' ? 0 : Number(value);

    // Validar que las horas no excedan el máximo mensual
    if (numValue > MAX_HORAS_NOCTURNAS_MENSUAL) {
      numValue = MAX_HORAS_NOCTURNAS_MENSUAL;
    }

    setRecargosNocturnosData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSaveHorasExtras = () => {
    const salarioPorHora = (formData.salario_base / 30) / 8;
    let totalHorasExtras = 0;

    TIPOS_HORAS_EXTRAS.forEach(({ tipo, recargo }) => {
      const horas = horasExtrasData[tipo] || 0;
      const valorHoraExtra = salarioPorHora * (1 + recargo);
      totalHorasExtras += horas * valorHoraExtra;
    });

    const valorTotalHorasExtras = Math.round(totalHorasExtras);

    setFormData(prev => {
      const salarioPorDia = prev.salario_base / 30;
      const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
      const pagoNeto = Math.round(salarioPorDiasTrabajados + prev.auxilio + valorTotalHorasExtras + prev.recargos_nocturnos);
      return { ...prev, valor_total_horas_extras: valorTotalHorasExtras, pago_neto: pagoNeto };
    });

    setHorasExtrasDialogOpen(false);
  };

  const handleSaveRecargosNocturnos = () => {
    const salarioPorHora = (formData.salario_base / 30) / 8;
    let totalRecargosNocturnos = 0;

    RECARGOS_NOCTURNOS.forEach(({ tipo, recargo }) => {
      const horas = recargosNocturnosData[tipo] || 0;
      const valorRecargoNocturno = salarioPorHora * recargo; // Solo el recargo, no la hora completa
      totalRecargosNocturnos += horas * valorRecargoNocturno;
    });

    const valorTotalRecargosNocturnos = Math.round(totalRecargosNocturnos);

    setFormData(prev => {
      const salarioPorDia = prev.salario_base / 30;
      const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
      const pagoNeto = Math.round(salarioPorDiasTrabajados + prev.auxilio + prev.valor_total_horas_extras + valorTotalRecargosNocturnos);
      return { ...prev, recargos_nocturnos: valorTotalRecargosNocturnos, pago_neto: pagoNeto };
    });

    setRecargosNocturnosDialogOpen(false);
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
            idTipoVinculacionSeleccionado === 2 || // contratista
            idTipoContratoSeleccionado === 3 ||    // Contrato por Prestación de Servicios
            idTipoContratoSeleccionado === 5       // Contrato de Aprendizaje
          ) {
            setRequiereAuxilio('no');
            setRequiereHorasExtras('no');
            setRequiereRecargosNocturnos('no');
            setHorasExtrasData({
              'Hora Extra Diurna': 0,
              'Hora Extra Nocturna': 0,
              'Hora Extra Diurna en Domingo/Festivo': 0,
              'Hora Extra Nocturna en Domingo/Festivo': 0,
            });
            setRecargosNocturnosData({
              'Recargo Nocturno': 0,
            });

            setFormData(prev => {
              const salarioPorDia = salarioNumerico / 30;
              const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
              const pagoNeto = Math.round(salarioPorDiasTrabajados);
              return {
                ...prev,
                salario_base: salarioNumerico,
                auxilio: 0,
                valor_total_horas_extras: 0,
                recargos_nocturnos: 0,
                pago_neto: pagoNeto,
              };
            });
          } else {
            setFormData(prev => {
              const salarioPorDia = salarioNumerico / 30;
              const salarioPorDiasTrabajados = salarioPorDia * prev.dias_a_pagar;
              const pagoNeto = Math.round(salarioPorDiasTrabajados + prev.auxilio + prev.valor_total_horas_extras + prev.recargos_nocturnos);
              return {
                ...prev,
                salario_base: salarioNumerico,
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
      recargos_nocturnos: 0,
      pago_neto: 0,
      id_contrato: 0,
      id_tipo_pago: 0
    });
    setRequiereAuxilio('no');
    setRequiereHorasExtras('no');
    setRequiereRecargosNocturnos('no');
    setHorasExtrasData({
      'Hora Extra Diurna': 0,
      'Hora Extra Nocturna': 0,
      'Hora Extra Diurna en Domingo/Festivo': 0,
      'Hora Extra Nocturna en Domingo/Festivo': 0,
    });
    setRecargosNocturnosData({
      'Recargo Nocturno': 0,
    });
    setIdTipoVinculacion(null);
    setIdTipoContrato(null);
    fetchCatalogosDetalle();
    setContratos([]);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = async (detalle: PlanillaDetalleData) => {
    setFormMode('editar');
    setFormData({ ...detalle });
    setRequiereAuxilio(detalle.auxilio > 0 ? 'si' : 'no');
    setRequiereHorasExtras(detalle.valor_total_horas_extras > 0 ? 'si' : 'no');
    setRequiereRecargosNocturnos(detalle.recargos_nocturnos > 0 ? 'si' : 'no');
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

      const { valor_total_horas_extras, ...restOfFormData } = formData;

      const payload = {
        cliente_id: clienteId,
        action: formMode === 'editar' ? 'modificar' : 'crear',
        ...restOfFormData,
        horas_extras: valor_total_horas_extras,
      };

      console.log("Enviando payload de detalle a API:", JSON.stringify(payload, null, 2));

      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);

      console.log("Respuesta recibida:", response.data);

      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'editar' ? 'Detalle actualizado exitosamente' : 'Detalle creado exitosamente');
        setDialogOpen(false);
        fetchPlanillaDetalles();
      }
    } catch (err: any) {
      console.error('Error al guardar detalle:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
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
      minimumFractionDigits: 0
    }).format(amount);
  };

  const puedeRecibirAuxilioHorasExtrasRecargos = () => {
    return (
      idTipoVinculacion !== 2 &&      // No es "contratista"
      idTipoContrato !== 3 &&         // No es "Contrato por Prestación de Servicios"
      idTipoContrato !== 5            // No es "Contrato de Aprendizaje"
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
                <TableCell>ID</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Contrato</TableCell>
                <TableCell>Tipo de Pago</TableCell>
                <TableCell align="right">Salario Base</TableCell>
                <TableCell align="right">Días a Pagar</TableCell>
                <TableCell align="right">Auxilio</TableCell>
                <TableCell align="right">Total a Pagar de Horas Extras</TableCell>
                <TableCell align="right">Recargos Nocturnos</TableCell>
                <TableCell align="right">Pago Neto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planillaDetalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell>{detalle.id}</TableCell>
                  <TableCell>{detalle.nombre_completo || `ID: ${detalle.id_persona}`}</TableCell>
                  <TableCell>{detalle.contrato_nombre || `ID: ${detalle.id_contrato}`}</TableCell>
                  <TableCell>{detalle.tipo_pago_nombre || `ID: ${detalle.id_tipo_pago}`}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.salario_base)}</TableCell>
                  <TableCell align="right">{detalle.dias_a_pagar}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.auxilio)}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.valor_total_horas_extras)}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.recargos_nocturnos)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {planillaDetalles.map((detalle) => (
        <Box key={`deducciones-${detalle.id}`} sx={{ mt: 2 }}>
          <PlanillaDeducciones 
            clienteId={clienteId}
            planillaDetalleId={detalle.id || 0}
            nombreEmpleado={detalle.nombre_completo}
            onDeduccionesChange={() => fetchPlanillaDetalles()} 
          />
        </Box>
      ))}

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
              <FormControl component="fieldset" sx={{ gridColumn: '1 / span 2', my: 1 }}>
                <FormLabel component="legend">¿El empleado trabajó horas extras?</FormLabel>
                <RadioGroup
                  row
                  name="requiere_horas_extras"
                  value={requiereHorasExtras}
                  onChange={handleHorasExtrasChange}
                >
                  <FormControlLabel value="si" control={<Radio />} label="Sí" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            )}

            <TextField
              label="Total a Pagar de Horas Extras"
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

            {puedeRecibirAuxilioHorasExtrasRecargos() && (
              <FormControl component="fieldset" sx={{ gridColumn: '1 / span 2', my: 1 }}>
                <FormLabel component="legend">¿El empleado trabajó en horario nocturno?</FormLabel>
                <RadioGroup
                  row
                  name="requiere_recargos_nocturnos"
                  value={requiereRecargosNocturnos}
                  onChange={handleRecargosNocturnosChange}
                >
                  <FormControlLabel value="si" control={<Radio />} label="Sí" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            )}

            <TextField
              label="Recargos Nocturnos"
              name="recargos_nocturnos"
              type="number"
              value={formData.recargos_nocturnos}
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

      <Dialog open={horasExtrasDialogOpen} onClose={() => setHorasExtrasDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Liquidar Horas Extras</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo de Hora Extra</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Recargo (%)</TableCell>
                  <TableCell>Cantidad de Horas</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TIPOS_HORAS_EXTRAS.map(({ tipo, horario, recargo, descripcion }) => (
                  <TableRow key={tipo}>
                    <TableCell>{tipo}</TableCell>
                    <TableCell>{horario}</TableCell>
                    <TableCell>{recargo}</TableCell>
                    <TableCell>
                      <TextField
                        name={tipo}
                        type="number"
                        value={horasExtrasData[tipo] || 0}
                        onChange={handleHorasExtrasInputChange}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>{descripcion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHorasExtrasDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveHorasExtras} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recargosNocturnosDialogOpen} onClose={() => setRecargosNocturnosDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Liquidar Recargos Nocturnos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Nota: Ingrese solo las horas nocturnas que no sean horas extras. Las horas extras nocturnas deben ingresarse en el formulario de horas extras.
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Recargo (%)</TableCell>
                  <TableCell>Cantidad de Horas</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {RECARGOS_NOCTURNOS.map(({ tipo, horario, recargo, descripcion }) => (
                  <TableRow key={tipo}>
                    <TableCell>{tipo}</TableCell>
                    <TableCell>{horario}</TableCell>
                    <TableCell>{recargo * 100}%</TableCell>
                    <TableCell>
                      <TextField
                        name={tipo}
                        type="number"
                        value={recargosNocturnosData[tipo] || 0}
                        onChange={handleRecargosNocturnosInputChange}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0, max: MAX_HORAS_NOCTURNAS_MENSUAL }}
                        helperText={`Máximo ${MAX_HORAS_NOCTURNAS_MENSUAL} horas al mes (${MAX_HORAS_NOCTURNAS_POR_DIA} horas por día)`}
                      />
                    </TableCell>
                    <TableCell>{descripcion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecargosNocturnosDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveRecargosNocturnos} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanillaDetalle;