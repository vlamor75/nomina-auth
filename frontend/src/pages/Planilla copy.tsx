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
import DashboardLayout from '../components/DashboardLayout';

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
}

interface PlanillaData {
  id?: number;
  fecha_inicial: string;
  fecha_final: string;
  id_periodicidad: number;
  periodicidad_nombre?: string;
  [key: string]: any;
}

interface PlanillaDetalleData {
  id?: number;
  id_planilla: number;
  id_persona: number;
  salario_base: number;
  dias_a_pagar: number;
  auxilio: number;
  horas_extras: number;
  recargos_nocturnos: number;
  pago_neto: number;
  id_contrato: number;
  id_tipo_pago: number;
  nombre_completo?: string;
  contrato_nombre?: string;
  tipo_pago_nombre?: string;
  [key: string]: any;
}

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface PersonaItem {
  id: number;
  nombre_completo: string;
}

// Hook para obtener datos de autenticación
const useAuth = (): { data: AuthData; loading: boolean; error: string | null } => {
  const [authData, setAuthData] = useState<AuthData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        console.log('Solicitando datos de usuario y esquema...');
        const response = await axios.get('http://localhost:3001/api/user-context', { withCredentials: true });
        
        if (response.data.isAuthenticated) {
          setAuthData({
            email: response.data.userInfo.email,
            empresaId: response.data.empresa?.id,
            schemaName: response.data.empresa?.schema
          });
          console.log('Datos de usuario obtenidos:', response.data);
        } else {
          setError('No estás autenticado');
        }
      } catch (err: any) {
        console.error('Error al obtener datos de autenticación:', err);
        setError(err.response?.data?.error || 'Error al obtener datos de autenticación');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, []);

  return { data: authData, loading, error };
};

const PLANILLA_API_URL = 'https://i8vay3901d.execute-api.us-east-1.amazonaws.com/dev/Crud_planilla';
const PLANILLA_DETALLE_API_URL = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';

const Planilla: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
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

  // Estado para planilla detalle
  const [planillaSeleccionadaId, setPlanillaSeleccionadaId] = useState<number | null>(null);
  const [planillaDetalles, setPlanillaDetalles] = useState<PlanillaDetalleData[]>([]);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [detalleFormMode, setDetalleFormMode] = useState<'crear' | 'editar'>('crear');
  const [detalleFormData, setDetalleFormData] = useState<PlanillaDetalleData>({
    id_planilla: 0,
    id_persona: 0,
    salario_base: 0,
    dias_a_pagar: 30,
    auxilio: 0,
    horas_extras: 0,
    recargos_nocturnos: 0,
    pago_neto: 0,
    id_contrato: 0,
    id_tipo_pago: 0
  });
  
  // Catálogos para detalle
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [contratos, setContratos] = useState<CatalogoItem[]>([]);
  const [tiposPago, setTiposPago] = useState<CatalogoItem[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  
  // Expandir/colapsar filas
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  
  // Cargar planillas y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      console.log("Nombre de esquema esperado:", authData.schemaName);
      fetchPlanillas();
      fetchPeriodicidades();
    }
  }, [clienteId, authData.schemaName]);
  
  // Función para cargar las planillas
  const fetchPlanillas = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando planillas para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer'
      };
      
      console.log("Payload para leer planillas:", payload);
      
      const response = await axios.post(PLANILLA_API_URL, payload);
      console.log("Respuesta de API (planillas):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPlanillas(response.data);
        console.log("Planillas cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error al cargar las planillas: formato inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar planillas:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al cargar las planillas');
    } finally {
      setLoading(false);
    }
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

  // Función para cargar detalles de una planilla
  const fetchPlanillaDetalles = async (planillaId: number) => {
    if (!clienteId) return;
    
    try {
      setLoadingDetalles(true);
      console.log("Solicitando detalles para planilla ID:", planillaId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer',
        id_planilla: planillaId
      };
      
      console.log("Payload para leer detalles:", payload);
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      console.log("Respuesta de API (detalles):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPlanillaDetalles(response.data);
        console.log("Detalles cargados:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setPlanillaDetalles([]);
      }
    } catch (err: any) {
      console.error('Error al cargar detalles de planilla:', err);
      setPlanillaDetalles([]);
    } finally {
      setLoadingDetalles(false);
    }
  };
  
  // Función para cargar catálogos para detalles
  const fetchCatalogosDetalle = async () => {
    if (!clienteId) return;
    
    try {
      setLoadingCatalogos(true);
      
      // Cargar personas
      const personasPayload = {
        cliente_id: clienteId,
        action: 'leer_personas'
      };
      
      const personasResponse = await axios.post(PLANILLA_DETALLE_API_URL, personasPayload);
      
      if (personasResponse.data && Array.isArray(personasResponse.data)) {
        setPersonas(personasResponse.data);
      } else {
        setPersonas([]);
      }
      
      // Cargar tipos de pago
      const tiposPagoPayload = {
        cliente_id: clienteId,
        action: 'leer_tipos_pago'
      };
      
      const tiposPagoResponse = await axios.post(PLANILLA_DETALLE_API_URL, tiposPagoPayload);
      
      if (tiposPagoResponse.data && Array.isArray(tiposPagoResponse.data)) {
        setTiposPago(tiposPagoResponse.data);
      } else {
        setTiposPago([]);
      }
      
    } catch (err: any) {
      console.error('Error al cargar catálogos para detalles:', err);
    } finally {
      setLoadingCatalogos(false);
    }
  };
  
  // Función para cargar contratos de una persona
  const fetchContratosPorPersona = async (personaId: number) => {
    if (!clienteId || !personaId) {
      setContratos([]);
      return;
    }
    
    try {
      setLoadingCatalogos(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer_contratos',
        id_persona: personaId
      };
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      
      if (response.data && Array.isArray(response.data)) {
        setContratos(response.data);
      } else {
        setContratos([]);
      }
    } catch (err: any) {
      console.error('Error al cargar contratos por persona:', err);
      setContratos([]);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Manejador para los cambios de TextField
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  // Manejador para los cambios de TextField en detalle
  const handleDetalleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, convertir a número
    if (['salario_base', 'dias_a_pagar', 'auxilio', 'horas_extras', 'recargos_nocturnos'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      setDetalleFormData(prev => {
        const newData = {...prev, [name]: numValue};
        
        // Calcular pago neto
        const salarioBase = name === 'salario_base' ? numValue : prev.salario_base;
        const diasAPagar = name === 'dias_a_pagar' ? numValue : prev.dias_a_pagar;
        const auxilio = name === 'auxilio' ? numValue : prev.auxilio;
        const horasExtras = name === 'horas_extras' ? numValue : prev.horas_extras;
        const recargosNocturnos = name === 'recargos_nocturnos' ? numValue : prev.recargos_nocturnos;
        
        const salarioPorDia = salarioBase / 30; // Suponiendo mes de 30 días
        const salarioPorDiasTrabajados = salarioPorDia * diasAPagar;
        
        const pagoNeto = Math.round(
          salarioPorDiasTrabajados + 
          auxilio + 
          horasExtras + 
          recargosNocturnos
        );
        
        return {...newData, pago_neto: pagoNeto};
      });
    } else {
      setDetalleFormData(prev => ({...prev, [name]: value}));
    }
  };

  // Manejador para los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value === '' ? '' : Number(value)}));
  };
  
  // Manejador para los Select en detalle
  const handleDetalleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    
    setDetalleFormData(prev => ({...prev, [name]: numValue}));
    
    // Si cambia la persona, cargar sus contratos
    if (name === 'id_persona' && numValue > 0) {
      fetchContratosPorPersona(numValue);
    }
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
  
  // Abrir diálogo para crear detalle de planilla
  const handleOpenCreateDetalleDialog = (planillaId: number) => {
    setDetalleFormMode('crear');
    setDetalleFormData({
      id_planilla: planillaId,
      id_persona: 0,
      salario_base: 0,
      dias_a_pagar: 30,
      auxilio: 0,
      horas_extras: 0,
      recargos_nocturnos: 0,
      pago_neto: 0,
      id_contrato: 0,
      id_tipo_pago: 0
    });
    fetchCatalogosDetalle();
    setDetalleDialogOpen(true);
  };
  
  // Abrir diálogo para editar detalle de planilla
  const handleOpenEditDetalleDialog = (detalle: PlanillaDetalleData) => {
    setDetalleFormMode('editar');
    setDetalleFormData({...detalle});
    fetchCatalogosDetalle();
    if (detalle.id_persona) {
      fetchContratosPorPersona(detalle.id_persona);
    }
    setDetalleDialogOpen(true);
  };
  
  // Manejar expandir/colapsar fila
  const handleToggleExpand = (planillaId: number) => {
    setExpandedRows(prev => {
      const isExpanded = prev[planillaId];
      
      if (!isExpanded) {
        // Solo cargar detalles si estamos expandiendo
        setPlanillaSeleccionadaId(planillaId);
        fetchPlanillaDetalles(planillaId);
      }
      
      return {
        ...prev,
        [planillaId]: !isExpanded
      };
    });
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
  
  // Guardar detalle de planilla (crear o editar)
  const handleSaveDetalle = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }
    
    try {
      setLoadingDetalles(true);
      setError(null);
      
      // Validar campos obligatorios
      const requiredFields = ['id_planilla', 'id_persona', 'salario_base', 'dias_a_pagar', 'id_contrato', 'id_tipo_pago'];
      const missingFields = requiredFields.filter(field => !detalleFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
        setLoadingDetalles(false);
        return;
      }
      
      // Preparar datos para enviar a la API
      const payload = {
        cliente_id: clienteId,
        action: detalleFormMode === 'editar' ? 'modificar' : 'crear',
        ...detalleFormData
      };
      
      console.log("Enviando payload de detalle a API:", JSON.stringify(payload, null, 2));
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      
      console.log("Respuesta recibida:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(detalleFormMode === 'crear' ? 'Detalle creado exitosamente' : 'Detalle actualizado exitosamente');
        setDetalleDialogOpen(false);
        
        // Recargar detalles de la planilla actual
        if (planillaSeleccionadaId) {
          fetchPlanillaDetalles(planillaSeleccionadaId);
        }
      }
    } catch (err: any) {
      console.error('Error al guardar detalle:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || `Error al ${detalleFormMode === 'crear' ? 'crear' : 'actualizar'} el detalle`);
    } finally {
      setLoadingDetalles(false);
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
  
  // Eliminar detalle de planilla
  const handleDeleteDetalle = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar este detalle de planilla?')) return;
    
    try {
      setLoadingDetalles(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'eliminar',
        id: id
      };
      
      console.log("Enviando payload para eliminar detalle:", payload);
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      console.log("Respuesta de eliminación de detalle:", response.data);
      
      if (response.status === 200) {
        setSuccess('Detalle eliminado exitosamente');
        
        // Recargar detalles de la planilla actual
        if (planillaSeleccionadaId) {
          fetchPlanillaDetalles(planillaSeleccionadaId);
        }
      }
    } catch (err: any) {
      console.error('Error al eliminar detalle:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar el detalle');
    } finally {
      setLoadingDetalles(false);
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
  
  // Formatear moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Renderizado condicional durante la carga
  if (loadingAuth) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Cargando información...</Typography>
        </Box>
      </DashboardLayout>
    );
  }
  
  // Renderizado condicional para error de autenticación
 // Renderizado condicional para error de autenticación
 if (errorAuth || !clienteId) {
  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: '800px', margin: '20px auto' }}>
        <Alert severity="error">
          {errorAuth || 'No se ha identificado una empresa asociada a tu cuenta. Por favor, registra una empresa primero.'}
        </Alert>
      </Box>
    </DashboardLayout>
  );
}

return (
  <DashboardLayout>
    <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 2, maxWidth: '1200px', margin: '20px auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Planillas</Typography>
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
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planillas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay planillas registradas</TableCell>
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
                        <TableCell colSpan={6} sx={{ p: 0 }}>
                          <Box sx={{ p: 2, bgcolor: '#f8f8f8' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6">Detalles de la planilla</Typography>
                              <Button 
                                variant="contained" 
                                color="secondary" 
                                startIcon={<AddIcon />}
                                onClick={() => planilla.id && handleOpenCreateDetalleDialog(planilla.id)}
                              >
                                Agregar Pago
                              </Button>
                            </Box>
                            
                            {loadingDetalles ? (
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
                                      <TableCell align="right">Horas Extras</TableCell>
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
                                        <TableCell align="right">{formatMoney(detalle.horas_extras)}</TableCell>
                                        <TableCell align="right">{formatMoney(detalle.recargos_nocturnos)}</TableCell>
                                        <TableCell align="right">{formatMoney(detalle.pago_neto)}</TableCell>
                                        <TableCell align="right">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenEditDetalleDialog(detalle)}
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
                          </Box>
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
    </Box>
    
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
    
    {/* Diálogo para crear/editar detalle de planilla */}
    <Dialog open={detalleDialogOpen} onClose={() => setDetalleDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {detalleFormMode === 'crear' ? 'Agregar Pago a la Planilla' : 'Editar Pago'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Empleado</InputLabel>
            <Select
              name="id_persona"
              value={String(detalleFormData.id_persona || '')}
              onChange={handleDetalleSelectChange}
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
              value={String(detalleFormData.id_contrato || '')}
              onChange={handleDetalleSelectChange}
              label="Contrato"
              disabled={!detalleFormData.id_persona}
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
              value={String(detalleFormData.id_tipo_pago || '')}
              onChange={handleDetalleSelectChange}
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
            value={detalleFormData.salario_base}
            onChange={handleDetalleTextFieldChange}
            fullWidth
            required
            variant="outlined"
          />
          
          <TextField
            label="Días a Pagar"
            name="dias_a_pagar"
            type="number"
            value={detalleFormData.dias_a_pagar}
            onChange={handleDetalleTextFieldChange}
            fullWidth
            required
            variant="outlined"
            InputProps={{ inputProps: { min: 0, max: 30 } }}
          />
          
          <TextField
            label="Auxilio"
            name="auxilio"
            type="number"
            value={detalleFormData.auxilio}
            onChange={handleDetalleTextFieldChange}
            fullWidth
            variant="outlined"
          />
          
          <TextField
            label="Horas Extras"
            name="horas_extras"
            type="number"
            value={detalleFormData.horas_extras}
            onChange={handleDetalleTextFieldChange}
            fullWidth
            variant="outlined"
          />
          
          <TextField
            label="Recargos Nocturnos"
            name="recargos_nocturnos"
            type="number"
            value={detalleFormData.recargos_nocturnos}
            onChange={handleDetalleTextFieldChange}
            fullWidth
            variant="outlined"
          />
          
          <TextField
            label="Pago Neto"
            type="number"
            value={detalleFormData.pago_neto}
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
        <Button onClick={() => setDetalleDialogOpen(false)} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSaveDetalle} 
          color="primary" 
          variant="contained"
          disabled={loadingDetalles}
        >
          {loadingDetalles ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  </DashboardLayout>
);
};

export default Planilla;