import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  KeyboardArrowDown as ExpandMoreIcon, 
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';
import PlanillaDetalle from './PlanillaDetalle';

interface PlanillaData {
  id?: number;
  fecha_inicial: string;
  fecha_final: string;
  id_periodicidad: number;
  periodicidad_nombre?: string;
  // Añadidos para los nuevos totales
  total_personas?: number;
  total_pago_neto?: number;
  total_deducciones_empleado?: number;
  total_deducciones_empleador?: number;
  [key: string]: any;
}

interface PlanillaDetalleData {
  id: number;
  id_planilla: number;
  id_persona: number;
  pago_neto: number;
  salud_empleado: number;
  pension_empleado: number;
  retencion_en_la_fuente: number;
  embargo: number;
  otros_descuentos: number;
  prestamo_empresa: number;
  salud_empleador: number;
  pension_empleador: number;
  sena_empleador: number;
  icbf: number;
  caja_compensacion_familiar: number;
  cesantias: number;
  prima_servicios: number;
  vacaciones: number;
  riesgos_laborales: number;
  nombre_completo: string;
  [key: string]: any;
}

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface PlanillaCabeceraProps {
  clienteId: number;
}

const PLANILLA_API_URL = 'https://i8vay3901d.execute-api.us-east-1.amazonaws.com/dev/Crud_planilla';
const PLANILLA_DETALLE_API_URL = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';

const PlanillaCabecera: React.FC<PlanillaCabeceraProps> = ({ clienteId }) => {
  // Estado para la lista de planillas
  const [planillas, setPlanillas] = useState<PlanillaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para el formulario de planilla
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<PlanillaData>({
    fecha_inicial: new Date().toISOString().split('T')[0],
    fecha_final: new Date().toISOString().split('T')[0],
    id_periodicidad: 0
  });
  
  // Estado para catálogos
  const [periodicidades, setPeriodicidades] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Expandir/colapsar filas
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  
  // Cargar planillas y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      fetchPlanillas();
      fetchPeriodicidades();
    }
  }, [clienteId]);
  
  // Función para cargar las planillas
 // Función para cargar las planillas con sus totales
const fetchPlanillas = async () => {
  if (!clienteId) return;
  
  try {
    setLoading(true);
    
    // 1. Obtener planillas
    const planillasPayload = {
      cliente_id: clienteId,
      action: 'leer'
    };
    
    console.log("Solicitando planillas para cliente_id:", clienteId);
    const planillasResponse = await axios.post(PLANILLA_API_URL, planillasPayload);
    
    if (!planillasResponse.data || !Array.isArray(planillasResponse.data)) {
      setError('Formato de respuesta inesperado');
      setLoading(false);
      return;
    }
    
    const planillasData = planillasResponse.data;
    console.log(`Se encontraron ${planillasData.length} planillas`);
    
    // 2. Para cada planilla, obtener detalles y calcular totales
    const planillasConTotales = await Promise.all(
      planillasData.map(async (planilla) => {
        if (!planilla.id) return planilla;
        
        // Consultar todos los detalles de esta planilla usando id_planilla
        const detallesPayload = {
          action: 'leer',
          cliente_id: clienteId,
          id_planilla: planilla.id
        };
        
        console.log(`Consultando detalles para planilla ID: ${planilla.id}`);
        
        try {
          const detallesResponse = await axios.post(PLANILLA_DETALLE_API_URL, detallesPayload);
          const detalles = detallesResponse.data;
          
          if (Array.isArray(detalles) && detalles.length > 0) {
            console.log(`Se encontraron ${detalles.length} detalles para la planilla ${planilla.id}`);
            
            // Calcular totales
            const total_personas = detalles.length;
            
            const total_pago_neto = detalles.reduce((sum, item) => 
              sum + (Number(item.pago_neto) || 0), 0);
            
            const total_deducciones_empleado = detalles.reduce((sum, item) => 
              sum + (Number(item.salud_empleado) || 0) + 
                    (Number(item.pension_empleado) || 0) + 
                    (Number(item.embargo) || 0) + 
                    (Number(item.otros_descuentos) || 0) + 
                    (Number(item.prestamo_empresa) || 0) + 
                    (Number(item.retencion_en_la_fuente) || 0), 0);
            
            const total_deducciones_empleador = detalles.reduce((sum, item) => 
              sum + (Number(item.salud_empleador) || 0) + 
                    (Number(item.pension_empleador) || 0) + 
                    (Number(item.sena_empleador) || 0) + 
                    (Number(item.ICBF) || 0) + 
                    (Number(item.caja_compensacion_familiar) || 0) + 
                    (Number(item.cesantias) || 0) + 
                    (Number(item.prima_servicios) || 0) + 
                    (Number(item.vacaciones) || 0) + 
                    (Number(item.riesgos_laborales) || 0), 0);
            
            console.log(`Totales calculados para planilla ${planilla.id}:`, {
              total_personas,
              total_pago_neto,
              total_deducciones_empleado,
              total_deducciones_empleador
            });
            
            return {
              ...planilla,
              total_personas,
              total_pago_neto,
              total_deducciones_empleado,
              total_deducciones_empleador
            };
          }
        } catch (detailsError) {
          console.error(`Error al obtener detalles para planilla ${planilla.id}:`, detailsError);
        }
        
        // Si hay errores o no hay datos, devolver planilla sin totales
        return {
          ...planilla,
          total_personas: 0,
          total_pago_neto: 0,
          total_deducciones_empleado: 0,
          total_deducciones_empleador: 0
        };
      })
    );
    
    console.log("Planillas con totales calculados:", planillasConTotales);
    setPlanillas(planillasConTotales);
    
  } catch (err: any) {
    console.error('Error al cargar planillas:', err);
    setError(err.response?.data?.error || 'Error al cargar las planillas');
  } finally {
    setLoading(false);
  }
};
  
  // Función para obtener los detalles de una planilla
  const fetchPlanillaDetalles = async (planillaId: number): Promise<PlanillaDetalleData[]> => {
    try {
      const payload = {
        action: 'leer',
        id: planillaId,
        cliente_id: clienteId
      };
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error(`Error al obtener detalles de planilla ${planillaId}:`, err);
      return [];
    }
  };
  
  // Función para calcular los totales a partir de los detalles de planilla
  const calcularTotalesPlanilla = (detalles: PlanillaDetalleData[]) => {
    if (!detalles || detalles.length === 0) {
      return {
        total_personas: 0,
        total_pago_neto: 0,
        total_deducciones_empleado: 0,
        total_deducciones_empleador: 0
      };
    }
    
    // Total de personas es simplemente la cantidad de registros
    const total_personas = detalles.length;
    
    // Sumar todos los pagos netos
    const total_pago_neto = detalles.reduce((sum, item) => sum + (item.pago_neto || 0), 0);
    
    // Calcular deducciones del empleado
    const total_deducciones_empleado = detalles.reduce((sum, item) => {
      return sum + 
        (item.salud_empleado || 0) + 
        (item.pension_empleado || 0) + 
        (item.retencion_en_la_fuente || 0) + 
        (item.embargo || 0) + 
        (item.otros_descuentos || 0) + 
        (item.prestamo_empresa || 0);
    }, 0);
    
    // Calcular deducciones del empleador
    const total_deducciones_empleador = detalles.reduce((sum, item) => {
      return sum + 
        (item.salud_empleador || 0) + 
        (item.pension_empleador || 0) + 
        (item.sena_empleador || 0) + 
        (item.icbf || 0) + 
        (item.caja_compensacion_familiar || 0) + 
        (item.cesantias || 0) + 
        (item.prima_servicios || 0) + 
        (item.vacaciones || 0) + 
        (item.riesgos_laborales || 0);
    }, 0);
    
    return {
      total_personas,
      total_pago_neto,
      total_deducciones_empleado,
      total_deducciones_empleador
    };
  };
  
  // Función para cargar periodicidades
  const fetchPeriodicidades = async () => {
    if (!clienteId) return;
    
    try {
      setLoadingCatalogos(true);
      console.log("Solicitando periodicidades para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer_periodicidades'
      };
      
      console.log("Payload para leer periodicidades:", payload);
      
      const response = await axios.post(PLANILLA_API_URL, payload);
      console.log("Respuesta de API (periodicidades):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPeriodicidades(response.data);
        console.log("Periodicidades cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setPeriodicidades([]);
      }
    } catch (err: any) {
      console.error('Error al cargar periodicidades:', err);
      setPeriodicidades([]);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Manejador para los cambios de TextField
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  // Manejador para los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value === '' ? '' : Number(value)}));
  };
  
  // Abrir diálogo para crear planilla
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      fecha_inicial: new Date().toISOString().split('T')[0],
      fecha_final: new Date().toISOString().split('T')[0],
      id_periodicidad: 0
    });
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar planilla
  const handleOpenEditDialog = (planilla: PlanillaData) => {
    setFormMode('editar');
    
    // Asegurar que las fechas sean procesadas correctamente
    // Tomar solo la parte de fecha sin aplicar transformaciones de zona horaria
    const formattedPlanilla = {
      ...planilla,
      fecha_inicial: planilla.fecha_inicial ? planilla.fecha_inicial.split('T')[0] : '',
      fecha_final: planilla.fecha_final ? planilla.fecha_final.split('T')[0] : ''
    };
    
    setFormData(formattedPlanilla);
    setDialogOpen(true);
  };
  
  // Manejar expandir/colapsar fila
  const handleToggleExpand = (planillaId: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [planillaId]: !prev[planillaId]
    }));
  };
  
  // Guardar planilla (crear o editar)
  const handleSavePlanilla = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validar campos obligatorios
      const requiredFields = ['fecha_inicial', 'fecha_final', 'id_periodicidad'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Preparar datos para enviar a la API - asegurando formato de fecha correcto
      const payload = {
        cliente_id: clienteId,
        action: formMode === 'editar' ? 'modificar' : 'crear',
        ...formData,
        // Asegurar que las fechas no se transforman por zona horaria
        fecha_inicial: formData.fecha_inicial.split('T')[0],
        fecha_final: formData.fecha_final.split('T')[0]
      };
      
      console.log("Enviando payload a API:", JSON.stringify(payload, null, 2));
      console.log("ID de empresa usado:", clienteId);
      console.log("Nombre de esquema esperado:", `empresa_${clienteId}`);
      
      const response = await axios.post(PLANILLA_API_URL, payload);
      
      console.log("Respuesta recibida:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'crear' ? 'Planilla creada exitosamente' : 'Planilla actualizada exitosamente');
        setDialogOpen(false);
        fetchPlanillas(); // Recargar la lista de planillas
      }
    } catch (err: any) {
      console.error('Error al guardar planilla:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} la planilla`);
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar planilla
  const handleDeletePlanilla = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta planilla y todos sus detalles?')) return;
    
    try {
      setLoading(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'eliminar',
        id: id
      };
      
      console.log("Enviando payload para eliminar:", payload);
      
      const response = await axios.post(PLANILLA_API_URL, payload);
      console.log("Respuesta de eliminación:", response.data);
      
      if (response.status === 200) {
        setSuccess('Planilla eliminada exitosamente');
        fetchPlanillas(); // Recargar la lista de planillas
      }
    } catch (err: any) {
      console.error('Error al eliminar planilla:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar la planilla');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatear fecha para mostrar correctamente, evitando problemas de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Extraer solo la parte de fecha (YYYY-MM-DD)
      const parts = dateString.split('T')[0].split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Los meses en JS van de 0-11
      const day = parseInt(parts[2]);
      
      // Crear fecha explícitamente en la zona horaria local
      const date = new Date(year, month, day);
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Formatear números como moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Planillas</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nueva Planilla
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px"></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Fecha Inicial</TableCell>
                <TableCell>Fecha Final</TableCell>
                <TableCell>Periodicidad</TableCell>
                <TableCell>Total Personas</TableCell>
                <TableCell>Total Pago Neto</TableCell>
                <TableCell>Total Deducciones Empleado</TableCell>
                <TableCell>Total Deducciones Empleador</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planillas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No hay planillas registradas</TableCell>
                </TableRow>
              ) : (
                planillas.map((planilla) => (
                  <React.Fragment key={planilla.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => planilla.id && handleToggleExpand(planilla.id)}
                        >
                          {expandedRows[planilla.id || 0] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{planilla.id}</TableCell>
                      <TableCell>{formatDate(planilla.fecha_inicial)}</TableCell>
                      <TableCell>{formatDate(planilla.fecha_final)}</TableCell>
                      <TableCell>{planilla.periodicidad_nombre}</TableCell>
                      <TableCell>{planilla.total_personas || 0}</TableCell>
                      <TableCell>{formatCurrency(planilla.total_pago_neto || 0)}</TableCell>
                      <TableCell>{formatCurrency(planilla.total_deducciones_empleado || 0)}</TableCell>
                      <TableCell>{formatCurrency(planilla.total_deducciones_empleador || 0)}</TableCell>
                      <TableCell align="right">
                        <Button 
                          color="primary" 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(planilla)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          color="error" 
                          size="small" 
                          startIcon={<DeleteIcon />}
                          onClick={() => planilla.id && handleDeletePlanilla(planilla.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Fila expandible para detalles de planilla */}
                    {expandedRows[planilla.id || 0] && (
                      <TableRow>
                        <TableCell colSpan={10} sx={{ p: 0 }}>
                          <PlanillaDetalle 
                            clienteId={clienteId} 
                            planillaId={planilla.id || 0} 
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para crear/editar planilla */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{formMode === 'crear' ? 'Crear Nueva Planilla' : 'Editar Planilla'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <TextField
              label="Fecha Inicial"
              name="fecha_inicial"
              type="date"
              value={formData.fecha_inicial}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Fecha Final"
              name="fecha_final"
              type="date"
              value={formData.fecha_final}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Periodicidad</InputLabel>
              <Select
                name="id_periodicidad"
                value={String(formData.id_periodicidad || '')}
                onChange={handleSelectChange}
                label="Periodicidad"
              >
                <MenuItem value=""><em>Seleccione</em></MenuItem>
                {periodicidades.map(per => (
                  <MenuItem key={per.id} value={String(per.id)}>{per.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSavePlanilla} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanillaCabecera;