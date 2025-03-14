import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Chip, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
}

interface AsignacionData {
  id?: number;
  persona_id: number;
  sede_id: number;
  fecha_inicio: string;
  fecha_fin?: string;
  // Campos adicionales para mostrar en la tabla (provenientes de JOIN)
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  identificacion?: number;
  sede_nombre?: string;
  [key: string]: any;
}

interface PersonaItem {
  id: number;
  nombre_completo: string;
  identificacion: number;
}

interface SedeItem {
  id: number;
  nombre: string;
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

const API_URL = 'https://ci6u5x5tj2.execute-api.us-east-1.amazonaws.com/dev/Crud_asignacion_sede';

const AsignacionSede: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
  // Estado para la lista de asignaciones
  const [asignaciones, setAsignaciones] = useState<AsignacionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<AsignacionData>({
    persona_id: 0,
    sede_id: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: ''
  });
  
  // Estado para catálogos
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar asignaciones y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      console.log("Nombre de esquema esperado:", authData.schemaName);
      fetchAsignaciones();
      fetchCatalogos();
    }
  }, [clienteId, authData.schemaName]);
  
  // Función para cargar las asignaciones
  const fetchAsignaciones = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando asignaciones para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer'
      };
      
      console.log("Payload para leer asignaciones:", payload);
      
      const response = await axios.post(API_URL, payload);
      console.log("Respuesta de API (asignaciones):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setAsignaciones(response.data);
        console.log("Asignaciones cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error al cargar las asignaciones: formato inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar asignaciones:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar catálogos (personas y sedes)
  const fetchCatalogos = async () => {
    if (!clienteId) return;
    
    try {
      setLoadingCatalogos(true);
      
      // Cargar personas activas
      try {
        const personasPayload = {
          cliente_id: clienteId,
          action: 'leer_personas'
        };
        
        console.log("Solicitando personas para cliente:", clienteId);
        const personasResponse = await axios.post(API_URL, personasPayload);
        
        if (personasResponse.data && Array.isArray(personasResponse.data)) {
          console.log("Personas cargadas:", personasResponse.data.length);
          setPersonas(personasResponse.data);
        } else {
          console.warn('Formato inesperado al cargar personas');
          setPersonas([]);
        }
      } catch (error) {
        console.error('No se pudieron cargar las personas:', error);
        setPersonas([]);
      }
      
      // Cargar sedes activas
      try {
        const sedesPayload = {
          cliente_id: clienteId,
          action: 'leer_sedes'
        };
        
        console.log("Solicitando sedes para cliente:", clienteId);
        const sedesResponse = await axios.post(API_URL, sedesPayload);
        
        if (sedesResponse.data && Array.isArray(sedesResponse.data)) {
          console.log("Sedes cargadas:", sedesResponse.data.length);
          setSedes(sedesResponse.data);
        } else {
          console.warn('Formato inesperado al cargar sedes');
          setSedes([]);
        }
      } catch (error) {
        console.error('No se pudieron cargar las sedes:', error);
        setSedes([]);
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
    setFormData(prev => ({...prev, [name]: value}));
  };

  // Manejador para los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value === '' ? 0 : Number(value)}));
  };
  
  // Filtrar asignaciones según búsqueda
  const asignacionesFiltradas = asignaciones.filter(asignacion => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      (asignacion.primer_nombre && asignacion.primer_nombre.toLowerCase().includes(terminoBusqueda)) ||
      (asignacion.primer_apellido && asignacion.primer_apellido.toLowerCase().includes(terminoBusqueda)) ||
      (asignacion.sede_nombre && asignacion.sede_nombre.toLowerCase().includes(terminoBusqueda)) ||
      (asignacion.identificacion && asignacion.identificacion.toString().includes(terminoBusqueda))
    );
  });
  
  // Obtener nombre completo de persona
  const getNombreCompleto = (asignacion: AsignacionData) => {
    return `${asignacion.primer_nombre || ''} ${asignacion.segundo_nombre || ''} ${asignacion.primer_apellido || ''} ${asignacion.segundo_apellido || ''}`.trim();
  };
  
  // Formatear fecha para mostrar

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'N/A';
    
    try {
      // Asegurar que la fecha se interprete en la zona horaria local
      const formattedDate = fecha.split('T')[0]; // Extraer solo YYYY-MM-DD
      const [year, month, day] = formattedDate.split('-');
      return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
    } catch (error) {
      return fecha;
    }
  };
  
  // Abrir diálogo para crear asignación
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      persona_id: 0,
      sede_id: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: ''
    });
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar asignación
  const handleOpenEditDialog = (asignacion: AsignacionData) => {
    setFormMode('editar');
    
    // Preparar dato para formulario
    // Preparar dato para formulario
   const asignacionParaFormulario = {
    id: asignacion.id,
    persona_id: asignacion.persona_id,
    sede_id: asignacion.sede_id,
    fecha_inicio: asignacion.fecha_inicio ? new Date(asignacion.fecha_inicio).toISOString().split('T')[0] : '',
    fecha_fin: asignacion.fecha_fin ? new Date(asignacion.fecha_fin).toISOString().split('T')[0] : ''
  };
  
  setFormData(asignacionParaFormulario);
  setDialogOpen(true);
};

// Guardar asignación (crear o editar)
const handleSaveAsignacion = async () => {
  if (!clienteId) {
    setError('Error: No se ha identificado el ID de la empresa');
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    // Validar campos obligatorios
    const requiredFields = ['persona_id', 'sede_id', 'fecha_inicio'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    // Preparar datos para enviar a la API
    const payload = {
      cliente_id: clienteId,
      action: formMode === 'editar' ? 'modificar' : 'crear',
      ...formData
    };
    
    console.log("Enviando payload a API:", JSON.stringify(payload, null, 2));
    console.log("ID de empresa usado:", clienteId);
    console.log("Nombre de esquema esperado:", `empresa_${clienteId}`);
    
    const response = await axios.post(API_URL, payload);
    
    console.log("Respuesta recibida:", response.data);
    
    if (response.status === 200 || response.status === 201) {
      setSuccess(formMode === 'crear' ? 'Asignación creada exitosamente' : 'Asignación actualizada exitosamente');
      setDialogOpen(false);
      fetchAsignaciones(); // Recargar la lista de asignaciones
    }
  } catch (err: any) {
    console.error('Error al guardar asignación:', err);
    console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
    setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} la asignación`);
  } finally {
    setLoading(false);
  }
};

// Eliminar asignación
const handleDeleteAsignacion = async (id: number) => {
  if (!clienteId) return;
  
  if (!window.confirm('¿Estás seguro de que deseas eliminar esta asignación?')) return;
  
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
      setSuccess('Asignación eliminada exitosamente');
      fetchAsignaciones(); // Recargar la lista de asignaciones
    }
  } catch (err: any) {
    console.error('Error al eliminar asignación:', err);
    console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
    setError(err.response?.data?.error || 'Error al eliminar la asignación');
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
        <Typography variant="h4">Asignación de Sedes</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nueva Asignación
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Barra de búsqueda */}
      <Box sx={{ mb: 3, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, sede o identificación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
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
                <TableCell>ID</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Fecha Inicio</TableCell>
                <TableCell>Fecha Fin</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asignacionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No hay asignaciones registradas</TableCell>
                </TableRow>
              ) : (
                asignacionesFiltradas.map((asignacion) => {
                  const fechaActual = new Date();
                  const fechaInicio = new Date(asignacion.fecha_inicio);
                  const fechaFin = asignacion.fecha_fin ? new Date(asignacion.fecha_fin) : null;
                  
                  // Determinar si la asignación está activa
                  const asignacionActiva = fechaInicio <= fechaActual && 
                                        (!fechaFin || fechaFin >= fechaActual);
                  
                  return (
                    <TableRow key={asignacion.id}>
                      <TableCell>{asignacion.id}</TableCell>
                      <TableCell>
                        {getNombreCompleto(asignacion)}
                        <Typography variant="caption" display="block" color="textSecondary">
                          ID: {asignacion.identificacion}
                        </Typography>
                      </TableCell>
                      <TableCell>{asignacion.sede_nombre}</TableCell>
                      <TableCell>{formatearFecha(asignacion.fecha_inicio)}</TableCell>
                      <TableCell>{asignacion.fecha_fin ? formatearFecha(asignacion.fecha_fin) : 'Indefinido'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={asignacionActiva ? 'Activa' : 'Inactiva'} 
                          color={asignacionActiva ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          color="primary" 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(asignacion)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          color="error" 
                          size="small" 
                          startIcon={<DeleteIcon />}
                          onClick={() => asignacion.id && handleDeleteAsignacion(asignacion.id)}
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
    
    {/* Diálogo para crear/editar asignación */}
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>{formMode === 'crear' ? 'Crear Nueva Asignación' : 'Editar Asignación'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Empleado</InputLabel>
            <Select
              name="persona_id"
              value={String(formData.persona_id || '')}
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
          
          <FormControl fullWidth required>
            <InputLabel>Sede</InputLabel>
            <Select
              name="sede_id"
              value={String(formData.sede_id || '')}
              onChange={handleSelectChange}
              label="Sede"
              disabled={loadingCatalogos}
            >
              <MenuItem value=""><em>Seleccione una sede</em></MenuItem>
              {sedes.map(sede => (
                <MenuItem key={sede.id} value={String(sede.id)}>{sede.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
          
          <TextField
            label="Fecha de Fin (opcional)"
            name="fecha_fin"
            type="date"
            value={formData.fecha_fin}
            onChange={handleTextFieldChange}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            helperText="Dejar en blanco si la asignación no tiene fecha de finalización"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSaveAsignacion} 
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

export default AsignacionSede;