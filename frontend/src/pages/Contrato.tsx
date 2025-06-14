import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Tabs, Tab, Chip, InputAdornment, Grid, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';

// Definición de niveles ARL
const nivelesARL = [
  {
    nivel: 1,
    descripcion: "Riesgo mínimo",
    porcentaje: "0.522%",
    ejemplos: "Oficinas administrativas, actividades sin exposición significativa a riesgos físicos, químicos o mecánicos."
  },
  {
    nivel: 2,
    descripcion: "Riesgo bajo",
    porcentaje: "1.044%",
    ejemplos: "Comercio minorista, servicios generales como limpieza o mantenimiento básico."
  },
  {
    nivel: 3,
    descripcion: "Riesgo medio",
    porcentaje: "2.436%",
    ejemplos: "Construcción ligera, manufactura no peligrosa, transporte terrestre."
  },
  {
    nivel: 4,
    descripcion: "Riesgo alto",
    porcentaje: "4.350%",
    ejemplos: "Construcción pesada, minería superficial, manejo de maquinaria pesada."
  },
  {
    nivel: 5,
    descripcion: "Riesgo máximo",
    porcentaje: "6.960%",
    ejemplos: "Trabajos en altura, espacios confinados, manipulación de sustancias químicas peligrosas, electricidad de alta tensión."
  }
];

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
}

interface ContratoData {
  id?: number;
  id_persona: number;
  id_tipo_vinculacion?: number;
  id_cargo: number;
  jornada_laboral_id?: number;
  id_tipo_contrato: number;
  fecha_inicio: string;
  fecha_fin?: string;
  salario: number;
  estado: boolean;
  fecha_registro?: string;
  centro_costos?: number; // Nuevo campo
  nivel_arl?: number; // Nuevo campo
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  identificacion?: number;
  cargo_nombre?: string;
  tipo_contrato_nombre?: string;
  tipo_vinculacion_nombre?: string;
  jornada_laboral_nombre?: string;
  [key: string]: any;
}

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface PersonaItem {
  id: number;
  nombre_completo: string;
  identificacion: number;
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

// URL de la API para contratos
const API_URL = 'https://p57h6xk7al.execute-api.us-east-1.amazonaws.com/dev/crud_contrato';

const Contrato: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
  // Estado para la lista de contratos
  const [contratos, setContratos] = useState<ContratoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para pestañas
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<ContratoData>({
    id_persona: 0,
    id_tipo_vinculacion: 0,
    id_cargo: 0,
    jornada_laboral_id: 0,
    id_tipo_contrato: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    salario: 0,
    estado: true,
    centro_costos: undefined, 
    nivel_arl: undefined 
  });
  
  // Estado para catálogos
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [tiposVinculacion, setTiposVinculacion] = useState<CatalogoItem[]>([]);
  const [cargos, setCargos] = useState<CatalogoItem[]>([]);
  const [jornadasLaborales, setJornadasLaborales] = useState<CatalogoItem[]>([]);
  const [tiposContrato, setTiposContrato] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar contratos y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      console.log("Nombre de esquema esperado:", authData.schemaName);
      fetchContratos();
      fetchCatalogos();
    }
  }, [clienteId, authData.schemaName]);
  
  // Función para cargar los contratos
  const fetchContratos = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando contratos para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer'
      };
      
      console.log("Payload para leer contratos:", payload);
      
      const response = await axios.post(API_URL, payload);
      console.log("Respuesta de API (contratos):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setContratos(response.data);
        console.log("Contratos cargados:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error al cargar los contratos: formato inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar contratos:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar todos los catálogos
  const fetchCatalogos = async () => {
    if (!clienteId) return;
    
    try {
      setLoadingCatalogos(true);
      
      const catalogos = [
        { action: 'leer_personas', setter: setPersonas, name: 'personas' },
        { action: 'leer_tipos_vinculacion', setter: setTiposVinculacion, name: 'tipos de vinculación' },
        { action: 'leer_cargos', setter: setCargos, name: 'cargos' },
        { action: 'leer_jornadas_laborales', setter: setJornadasLaborales, name: 'jornadas laborales' },
        { action: 'leer_tipos_contrato', setter: setTiposContrato, name: 'tipos de contrato' }
      ];
      
      for (const catalogo of catalogos) {
        try {
          const payload = {
            cliente_id: clienteId,
            action: catalogo.action
          };
          
          console.log(`Solicitando ${catalogo.name} para cliente:`, clienteId);
          const response = await axios.post(API_URL, payload);
          
          if (response.data && Array.isArray(response.data)) {
            console.log(`${catalogo.name} cargados:`, response.data.length);
            catalogo.setter(response.data);
          } else {
            console.warn(`Formato inesperado al cargar ${catalogo.name}`);
            catalogo.setter([]);
          }
        } catch (error) {
          console.error(`No se pudieron cargar los ${catalogo.name}:`, error);
          catalogo.setter([]);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar catálogos:', err);
    } finally {
      setLoadingCatalogos(false);
    }
  };
  
  // Manejador para los cambios de TextField
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Manejo especial para campos numéricos
    if (name === 'salario' || name === 'centro_costos') {
      const numericValue = value.replace(/[^0-9]/g, ''); // Solo números
      setFormData(prev => ({
        ...prev,
        [name]: numericValue ? parseInt(numericValue, 10) : null
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manejador para los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : Number(value) // Permitir null para nivel_arl
    }));
    
    if (name === 'id_tipo_vinculacion') {
      const tipoVinculacionId = Number(value);
      
      const tipoVinculacionSeleccionado = tiposVinculacion.find(
        tipo => tipo.id === tipoVinculacionId
      );
      
      const esContratista = tipoVinculacionSeleccionado?.nombre.toLowerCase().includes('contratista');
      const esEmpleado = tipoVinculacionSeleccionado?.nombre.toLowerCase().includes('empleado');
      
      const contratoPrestacionServiciosId = tiposContrato.find(
        tipo => tipo.nombre.toLowerCase().includes('prestación de servicios')
      )?.id;
      
      if (esContratista && contratoPrestacionServiciosId) {
        setFormData(prev => ({
          ...prev,
          id_tipo_contrato: contratoPrestacionServiciosId
        }));
      } else if (esEmpleado && formData.id_tipo_contrato === contratoPrestacionServiciosId) {
        setFormData(prev => ({
          ...prev,
          id_tipo_contrato: 0
        }));
      }
    }
  };
  
  // Manejador para cambio de pestañas
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Formatear fecha para mostrar
  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'N/A';
    
    try {
      const formattedDate = fecha.split('T')[0];
      const [year, month, day] = formattedDate.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return fecha;
    }
  };
  
  // Formatear salario
  const formatearSalario = (salario: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(salario);
  };
  
  // Obtener nombre completo de persona
  const getNombreCompleto = (contrato: ContratoData) => {
    return `${contrato.primer_nombre || ''} ${contrato.segundo_nombre || ''} ${contrato.primer_apellido || ''} ${contrato.segundo_apellido || ''}`.trim();
  };
  
  // Filtrar contratos según búsqueda
  const contratosFiltrados = contratos.filter(contrato => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      (contrato.primer_nombre && contrato.primer_nombre.toLowerCase().includes(terminoBusqueda)) ||
      (contrato.primer_apellido && contrato.primer_apellido.toLowerCase().includes(terminoBusqueda)) ||
      (contrato.cargo_nombre && contrato.cargo_nombre.toLowerCase().includes(terminoBusqueda)) ||
      (contrato.tipo_contrato_nombre && contrato.tipo_contrato_nombre.toLowerCase().includes(terminoBusqueda)) ||
      (contrato.identificacion && contrato.identificacion.toString().includes(terminoBusqueda))
    );
  });
  
  // Filtrar contratos según estado (activo/inactivo)
  const contratosActivos = contratosFiltrados.filter(contrato => contrato.estado === true);
  const contratosInactivos = contratosFiltrados.filter(contrato => contrato.estado === false);
  
  // Abrir diálogo para crear contrato
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      id_persona: 0,
      id_tipo_vinculacion: 0,
      id_cargo: 0,
      jornada_laboral_id: 0,
      id_tipo_contrato: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      salario: 0,
      estado: true,
      centro_costos: undefined, 
      nivel_arl: undefined 
    });
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar contrato
  const handleOpenEditDialog = (contrato: ContratoData) => {
    setFormMode('editar');
    
    const contratoParaFormulario: ContratoData = {
      id: contrato.id,
      id_persona: contrato.id_persona || 0,
      id_tipo_vinculacion: contrato.id_tipo_vinculacion || 0,
      id_cargo: contrato.id_cargo || 0,
      jornada_laboral_id: contrato.jornada_laboral_id || 0,
      id_tipo_contrato: contrato.id_tipo_contrato || 0,
      fecha_inicio: contrato.fecha_inicio ? new Date(contrato.fecha_inicio).toISOString().split('T')[0] : '',
      fecha_fin: contrato.fecha_fin ? new Date(contrato.fecha_fin).toISOString().split('T')[0] : '',
      salario: contrato.salario || 0,
      estado: contrato.estado ?? true,
      centro_costos: contrato.centro_costos, 
      nivel_arl: contrato.nivel_arl 
    };
    
    setFormData(contratoParaFormulario);
    setDialogOpen(true);
  };
  
  // Guardar contrato (crear o editar)
  const handleSaveContrato = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const requiredFields = ['id_persona', 'id_cargo', 'id_tipo_contrato', 'fecha_inicio', 'salario'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      if (isNaN(Number(formData.salario)) || Number(formData.salario) <= 0) {
        setError('El salario debe ser un valor numérico mayor que cero');
        setLoading(false);
        return;
      }
      
      const payload = {
        cliente_id: clienteId,
        action: formMode === 'editar' ? 'modificar' : 'crear',
        ...formData,
        salario: Number(formData.salario)
      };
      
      console.log("Enviando payload a API:", JSON.stringify(payload, null, 2));
      console.log("ID de empresa usado:", clienteId);
      console.log("Nombre de esquema esperado:", `empresa_${clienteId}`);
      
      const response = await axios.post(API_URL, payload);
      
      console.log("Respuesta recibida:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'crear' ? 'Contrato creado exitosamente' : 'Contrato actualizado exitosamente');
        setDialogOpen(false);
        fetchContratos();
      }
    } catch (err: any) {
      console.error('Error al guardar contrato:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} el contrato`);
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar contrato
  const handleDeleteContrato = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar este contrato?')) return;
    
    try {
      setLoading(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'eliminar',
        id: id
      };
      
      console.log("Enviando payload para eliminar:", payload);
      
      const response = await axios.post(API_URL, payload);
      console.log("Respuesta de eliminación:", response.data);
      
      if (response.status === 200) {
        setSuccess('Contrato eliminado exitosamente');
        fetchContratos();
      }
    } catch (err: any) {
      console.error('Error al eliminar contrato:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar el contrato');
    } finally {
      setLoading(false);
    }
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
          <Typography variant="h4">Gestión de Contratos</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Nuevo Contrato
          </Button>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box sx={{ mb: 3, display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, cargo, tipo de contrato o identificación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Todos (${contratosFiltrados.length})`} />
            <Tab label={`Activos (${contratosActivos.length})`} />
            <Tab label={`Inactivos (${contratosInactivos.length})`} />
          </Tabs>
        </Box>


 {loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
) : (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>ID</TableCell><TableCell>Empleado</TableCell><TableCell>Cargo</TableCell><TableCell>Tipo Contrato</TableCell><TableCell>Fecha Inicio</TableCell><TableCell>Fecha Fin</TableCell><TableCell>Salario</TableCell><TableCell>Centro Costos</TableCell><TableCell>Nivel ARL</TableCell><TableCell>Estado</TableCell><TableCell>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {(tabValue === 0 ? contratosFiltrados : 
          tabValue === 1 ? contratosActivos : contratosInactivos).length === 0 ? (
          <TableRow><TableCell colSpan={11} align="center">No hay contratos registrados</TableCell></TableRow>
        ) : (
          (tabValue === 0 ? contratosFiltrados : 
           tabValue === 1 ? contratosActivos : contratosInactivos).map((contrato) => {
            const fechaActual = new Date();
            const fechaInicio = new Date(contrato.fecha_inicio);
            const fechaFin = contrato.fecha_fin ? new Date(contrato.fecha_fin) : null;
            
            const contratoVigente = fechaInicio <= fechaActual && 
                                  (!fechaFin || fechaFin >= fechaActual);
            
            return (
              <TableRow key={contrato.id}>
                <TableCell>{contrato.id}</TableCell>
                <TableCell>
                  {getNombreCompleto(contrato)}
                  <Typography variant="caption" display="block" color="textSecondary">
                    ID: {contrato.identificacion}
                  </Typography>
                </TableCell>
                <TableCell>{contrato.cargo_nombre}</TableCell>
                <TableCell>{contrato.tipo_contrato_nombre}</TableCell>
                <TableCell>{formatearFecha(contrato.fecha_inicio)}</TableCell>
                <TableCell>{contrato.fecha_fin ? formatearFecha(contrato.fecha_fin) : 'Indefinido'}</TableCell>
                <TableCell>{formatearSalario(contrato.salario)}</TableCell>
                <TableCell>{contrato.centro_costos || 'N/A'}</TableCell>
                <TableCell>
                  {contrato.nivel_arl ? (
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2">{nivelesARL[contrato.nivel_arl - 1].descripcion}</Typography>
                          <Typography variant="caption">Porcentaje: {nivelesARL[contrato.nivel_arl - 1].porcentaje}</Typography>
                          <Typography variant="caption" display="block">
                            Ejemplos: {nivelesARL[contrato.nivel_arl - 1].ejemplos}
                          </Typography>
                        </Box>
                      }
                    >
                      <Chip
                        label={`Nivel ${contrato.nivel_arl}`}
                        size="small"
                        color="info"
                      />
                    </Tooltip>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={contrato.estado ? 'Activo' : 'Inactivo'} 
                    color={contrato.estado ? 'success' : 'error'} 
                    size="small" 
                  />
                  {contrato.estado && !contratoVigente && (
                    <Chip 
                      label="Fuera de periodo" 
                      color="warning" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    color="primary" 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(contrato)}
                    sx={{ mr: 1 }}
                  >
                    Editar
                  </Button>
                  <Button 
                    color="error" 
                    size="small" 
                    startIcon={<DeleteIcon />}
                    onClick={() => contrato.id && handleDeleteContrato(contrato.id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </TableContainer>
)}
      </Box>
      
      {/* Diálogo para crear/editar contrato */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{formMode === 'crear' ? 'Crear Nuevo Contrato' : 'Editar Contrato'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Información básica */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Información Básica</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    name="id_persona"
                    value={String(formData.id_persona || '')}
                    onChange={handleSelectChange}
                    label="Empleado"
                    disabled={loadingCatalogos}
                  >
                    <MenuItem value=""><em>Seleccione un empleado</em></MenuItem>
                    {personas.map(persona => (
                      <MenuItem key={persona.id} value={String(persona.id)}>
                        {persona.nombre_completo} - {persona.identificacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cargo</InputLabel>
                  <Select
                    name="id_cargo"
                    value={String(formData.id_cargo || '')}
                    onChange={handleSelectChange}
                    label="Cargo"
                    disabled={loadingCatalogos}
                  >
                    <MenuItem value=""><em>Seleccione un cargo</em></MenuItem>
                    {cargos.map(cargo => (
                      <MenuItem key={cargo.id} value={String(cargo.id)}>{cargo.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Vinculación</InputLabel>
                  <Select
                    name="id_tipo_vinculacion"
                    value={String(formData.id_tipo_vinculacion || '')}
                    onChange={handleSelectChange}
                    label="Tipo de Vinculación"
                    disabled={loadingCatalogos}
                  >
                    <MenuItem value=""><em>Seleccione</em></MenuItem>
                    {tiposVinculacion.map(tipo => (
                      <MenuItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Jornada Laboral</InputLabel>
                  <Select
                    name="jornada_laboral_id"
                    value={String(formData.jornada_laboral_id || '')}
                    onChange={handleSelectChange}
                    label="Jornada Laboral"
                    disabled={loadingCatalogos}
                  >
                    <MenuItem value=""><em>Seleccione</em></MenuItem>
                    {jornadasLaborales.map(jornada => (
                      <MenuItem key={jornada.id} value={String(jornada.id)}>{jornada.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Información del contrato */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Información del Contrato</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Contrato</InputLabel>
                  <Select
                    name="id_tipo_contrato"
                    value={String(formData.id_tipo_contrato || '')}
                    onChange={handleSelectChange}
                    label="Tipo de Contrato"
                    disabled={loadingCatalogos}
                  >
                    <MenuItem value=""><em>Seleccione</em></MenuItem>
                    {tiposContrato
                      .filter(tipo => {
                        const tipoVinculacionSeleccionado = tiposVinculacion.find(
                          t => t.id === formData.id_tipo_vinculacion
                        );
                        
                        if (!tipoVinculacionSeleccionado) return true;
                        
                        const esContratista = tipoVinculacionSeleccionado.nombre.toLowerCase().includes('contratista');
                        const esEmpleado = tipoVinculacionSeleccionado.nombre.toLowerCase().includes('empleado');
                        
                        if (esContratista) {
                          return tipo.nombre.toLowerCase().includes('prestación de servicios');
                        }
                        if (esEmpleado) {
                          return !tipo.nombre.toLowerCase().includes('prestación de servicios');
                        }
                        return true;
                      })
                      .map(tipo => (
                        <MenuItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Salario"
                  name="salario"
                  type="text"
                  value={formData.salario}
                  onChange={handleTextFieldChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleTextFieldChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Fin (opcional)"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={handleTextFieldChange}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  helperText="Dejar en blanco si el contrato no tiene fecha de finalización"
                  disabled={tiposContrato.some(tipo => 
                    tipo.id === formData.id_tipo_contrato && 
                    tipo.nombre.toLowerCase().includes('indefinido')
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Centro de Costos (opcional)"
                  name="centro_costos"
                  type="text"
                  value={formData.centro_costos || ''}
                  onChange={handleTextFieldChange}
                  fullWidth
                  variant="outlined"
                  inputProps={{ maxLength: 4 }} // Máximo 4 dígitos
                  helperText="Código numérico de hasta 4 dígitos"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Nivel ARL (opcional)</InputLabel>
                  <Select
                    name="nivel_arl"
                    value={String(formData.nivel_arl || '')}
                    onChange={handleSelectChange}
                    label="Nivel ARL (opcional)"
                  >
                    <MenuItem value=""><em>Seleccione</em></MenuItem>
                    {nivelesARL.map(nivel => (
                      <MenuItem key={nivel.nivel} value={String(nivel.nivel)}>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2">{nivel.descripcion}</Typography>
                              <Typography variant="caption">Porcentaje: {nivel.porcentaje}</Typography>
                              <Typography variant="caption" display="block">
                                Ejemplos: {nivel.ejemplos}
                              </Typography>
                            </Box>
                          }
                        >
                          <Typography>Nivel {nivel.nivel} - {nivel.descripcion}</Typography>
                        </Tooltip>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formData.estado ? "1" : "0"}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value === "1" })}
                    label="Estado"
                  >
                    <MenuItem value="1">Activo</MenuItem>
                    <MenuItem value="0">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSaveContrato} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default Contrato;