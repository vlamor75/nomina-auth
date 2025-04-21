// frontend\src\pages\Planilla\PlanillaDetalle\hooks\usePlanillaDetalle.ts
import { useState, useEffect } from 'react';
import {
  fetchPlanillaDetalles, saveDetalle, deleteDetalle, fetchCatalogosDetalle,
  fetchContratosPorPersona, fetchContratoDetails, fetchContratosActivos,
} from '../api';
import { PlanillaDetalleData, PersonaItem, CatalogoItem, ContratoItem } from '../types';

export const usePlanillaDetalle = (clienteId: number, planillaId: number) => {
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
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [tiposPago, setTiposPago] = useState<CatalogoItem[]>([]);
  const [contratosPorPersona, setContratosPorPersona] = useState<ContratoItem[]>([]);
  const [novedadesDialogOpen, setNovedadesDialogOpen] = useState(false);
  const [editHorasExtrasOpen, setEditHorasExtrasOpen] = useState(false);
  const [editRecargosNocturnosOpen, setEditRecargosNocturnosOpen] = useState(false);
  const [editDeduccionesOpen, setEditDeduccionesOpen] = useState(false);
  const [horasExtrasData, setHorasExtrasData] = useState<{ [key: string]: number }>({
    Diurna: 0,
    Nocturna: 0,
    'Diurna en Domingo/Festivo': 0,
    'Nocturna en Domingo/Festivo': 0,
  });
  const [recargosNocturnosData, setRecargosNocturnosData] = useState<{ [key: string]: number }>({ 'Recargo Nocturno': 0 });
  const [deduccionesData, setDeduccionesData] = useState<{ [key: string]: number }>({
    'Salud Empleado': 0,
    'Pensión Empleado': 0,
    Embargo: 0,
    'Otros Descuentos': 0,
    'Préstamo Empresa': 0,
    'Retención en la Fuente': 0,
    'Salud Empleador': 0,
    'Pensión Empleador': 0,
    'SENA Empleador': 0,
    ICBF: 0,
    'Caja Compensación Familiar': 0,
    Cesantías: 0,
    'Prima de Servicios': 0,
    Vacaciones: 0,
    'Riesgos Laborales': 0,
  });

  useEffect(() => {
    if (clienteId && planillaId) {
      setLoading(true);
      fetchPlanillaDetalles(clienteId, planillaId)
        .then(data => setPlanillaDetalles(data))
        .catch(() => setError('Error al cargar detalles'))
        .finally(() => setLoading(false));
    }
  }, [clienteId, planillaId]);

  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({ ...formData, id_persona: 0, salario_base: 0 });
    setDialogOpen(true);
    fetchCatalogosDetalle(clienteId).then(({ personas, tiposPago }) => {
      setPersonas(personas);
      setTiposPago(tiposPago);
    });
  };

  const handleOpenEditDialog = (detalle: PlanillaDetalleData) => {
    setFormMode('editar');
    setFormData(detalle);
    setDialogOpen(true);
    fetchContratosPorPersona(clienteId, detalle.id_persona).then(setContratosPorPersona);
  };

  const handleSaveDetalle = async () => {
    setLoading(true);
    try {
      const updatedFormData = {
        ...formData,
        valor_total_horas_extras: Object.values(horasExtrasData).reduce((sum, val) => sum + val, 0),
        recargo_nocturno: Object.values(recargosNocturnosData).reduce((sum, val) => sum + val, 0),
        salud_empleado: deduccionesData['Salud Empleado'],
        pension_empleado: deduccionesData['Pensión Empleado'],
        embargo: deduccionesData['Embargo'],
        otros_descuentos: deduccionesData['Otros Descuentos'],
        prestamo_empresa: deduccionesData['Préstamo Empresa'],
        retencion_en_la_fuente: deduccionesData['Retención en la Fuente'],
        salud_empleador: deduccionesData['Salud Empleador'],
        pension_empleador: deduccionesData['Pensión Empleador'],
        sena_empleador: deduccionesData['SENA Empleador'],
        ICBF: deduccionesData['ICBF'],
        caja_compensacion_familiar: deduccionesData['Caja Compensación Familiar'],
        cesantias: deduccionesData['Cesantías'],
        prima_servicios: deduccionesData['Prima de Servicios'],
        vacaciones: deduccionesData['Vacaciones'],
        riesgos_laborales: deduccionesData['Riesgos Laborales'],
      };
      await saveDetalle(clienteId, updatedFormData, formMode);
      setSuccess(formMode === 'crear' ? 'Creado exitosamente' : 'Actualizado exitosamente');
      setDialogOpen(false);
      fetchPlanillaDetalles(clienteId, planillaId).then(setPlanillaDetalles);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDetalle = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este detalle?')) {
      setLoading(true);
      try {
        await deleteDetalle(clienteId, id);
        setSuccess('Eliminado exitosamente');
        fetchPlanillaDetalles(clienteId, planillaId).then(setPlanillaDetalles);
      } catch (err: any) {
        setError('Error al eliminar');
      } finally {
        setLoading(false);
      }
    }
  };

  const cargarContratosActivos = async () => {
    setLoading(true);
    try {
      const contratos = await fetchContratosActivos(clienteId);
      const nuevosDetalles = await Promise.all(
        contratos.map(async (contrato) => {
          const detallesContrato = await fetchContratoDetails(clienteId, contrato.id, contrato.id_persona || 0);
          return {
            ...formData,
            id_persona: contrato.id_persona || 0,
            id_contrato: contrato.id,
            salario_base: parseFloat(contrato.salario || '0'),
            id_tipo_vinculacion: contrato.id_tipo_vinculacion,
            id_tipo_contrato: contrato.id_tipo_contrato,
            nombre_completo: contrato.nombre,
          };
        })
      );
      const detallesParaGuardar = nuevosDetalles.filter(nuevo =>
        !planillaDetalles.some(existente => existente.id_contrato === nuevo.id_contrato)
      );
      await Promise.all(detallesParaGuardar.map(detalle =>
        saveDetalle(clienteId, detalle, 'crear')
      ));
      setSuccess('Contratos activos cargados exitosamente');
      fetchPlanillaDetalles(clienteId, planillaId).then(setPlanillaDetalles);
    } catch (err: any) {
      setError('Error al cargar contratos activos');
    } finally {
      setLoading(false);
    }
  };

  return {
    planillaDetalles,
    loading,
    error,
    success,
    dialogOpen,
    setDialogOpen,
    formMode,
    formData,
    setFormData,
    personas,
    tiposPago,
    contratosPorPersona,
    novedadesDialogOpen,
    setNovedadesDialogOpen,
    editHorasExtrasOpen,
    setEditHorasExtrasOpen,
    editRecargosNocturnosOpen,
    setEditRecargosNocturnosOpen,
    editDeduccionesOpen,
    setEditDeduccionesOpen,
    horasExtrasData,
    setHorasExtrasData,
    recargosNocturnosData,
    setRecargosNocturnosData,
    deduccionesData,
    setDeduccionesData,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleSaveDetalle,
    handleDeleteDetalle,
    cargarContratosActivos,
  };
};