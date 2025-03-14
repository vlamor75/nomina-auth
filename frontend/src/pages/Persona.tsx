import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Tabs, Tab, Grid, Chip, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
}

interface PersonaData {
  id?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  tipo_documento: number;
  identificacion: number;
  grupo_sanguineo?: number;
  sexo?: number;
  estado_civil?: number;
  movil?: number;
  departamento?: number;
  municipio?: number;
  direccion?: string;
  correo_electronico?: string;
  fecha_nacimiento?: string;
  estado_empleado: boolean;
  id_arl?: number;
  id_banco?: number;
  id_tipo_cuenta?: number;
  numero_cta?: string;
  id_caja_compensacion?: number;
  fecha_registro?: string;
  [key: string]: any;
}

interface CatalogoItem {
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

const API_URL = 'https://ujjv8lyoo2.execute-api.us-east-1.amazonaws.com/dev/crud_persona';
const CATALOGO_API_URL = 'https://whxuvb6me1.execute-api.us-east-1.amazonaws.com/dev/GestionEmpresa';

const Persona: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
  // Estado para la lista de personas
  const [personas, setPersonas] = useState<PersonaData[]>([]);
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
  const [formData, setFormData] = useState<PersonaData>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_documento: 0,
    identificacion: 0,
    grupo_sanguineo: 0,
    sexo: 0,
    estado_civil: 0,
    movil: 0,
    departamento: 0,
    municipio: 0,
    direccion: '',
    correo_electronico: '',
    fecha_nacimiento: '',
    estado_empleado: true,
    id_arl: 0,
    id_banco: 0,
    id_tipo_cuenta: 0,
    numero_cta: '',
    id_caja_compensacion: 0
  });
  
  // Estado para catálogos
  const [tiposDocumento, setTiposDocumento] = useState<CatalogoItem[]>([]);
  const [gruposSanguineos, setGruposSanguineos] = useState<CatalogoItem[]>([]);
  const [sexos, setSexos] = useState<CatalogoItem[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<CatalogoItem[]>([]);
  const [departamentos, setDepartamentos] = useState<CatalogoItem[]>([]);
  const [municipios, setMunicipios] = useState<CatalogoItem[]>([]);
  const [arls, setArls] = useState<CatalogoItem[]>([]);
  const [bancos, setBancos] = useState<CatalogoItem[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<CatalogoItem[]>([]);
  const [cajasCompensacion, setCajasCompensacion] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar personas y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      console.log("Nombre de esquema esperado:", authData.schemaName);
      fetchPersonas();
      fetchAllCatalogos();
    }
  }, [clienteId, authData.schemaName]);
  
  // Función para cargar las personas
  const fetchPersonas = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando personas para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer'
      };
      
      console.log("Payload para leer personas:", payload);
      
      const response = await axios.post(API_URL, payload);
      console.log("Respuesta de API (personas):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPersonas(response.data);
        console.log("Personas cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error al cargar las personas: formato inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar personas:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar todos los catálogos
  const fetchAllCatalogos = async () => {
    try {
      setLoadingCatalogos(true);
      
      // Cargar departamentos
      try {
        const deptosResponse = await axios.get(`${CATALOGO_API_URL}?listar=departamentos`);
        if (deptosResponse.data && Array.isArray(deptosResponse.data)) {
          console.log("Departamentos cargados:", deptosResponse.data.length);
          setDepartamentos(deptosResponse.data);
        }
      } catch (error) {
        console.warn('No se pudieron cargar los departamentos');
      }
      
      // Cargar catálogos del esquema del cliente
     const catalogos = [
      { action: 'leer_tipos_documento', setter: setTiposDocumento, name: 'tipos de documento' },
      { action: 'leer_grupos_sanguineos', setter: setGruposSanguineos, name: 'grupos sanguíneos' },
      { action: 'leer_sexos', setter: setSexos, name: 'sexos' },
      { action: 'leer_estados_civiles', setter: setEstadosCiviles, name: 'estados civiles' },
      { action: 'leer_arls', setter: setArls, name: 'ARLs' },
      { action: 'leer_bancos', setter: setBancos, name: 'bancos' },
      { action: 'leer_tipos_cuenta', setter: setTiposCuenta, name: 'tipos de cuenta' },
      { action: 'leer_cajas_compensacion', setter: setCajasCompensacion, name: 'cajas de compensación' },
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
          console.log(`${catalogo.name} cargados:`, response.data);
          catalogo.setter(response.data);
        } else if (response.data && response.data.error) {
          console.warn(`Error al cargar ${catalogo.name}:`, response.data.error);
          catalogo.setter([]);
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

// Cargar municipios cuando cambia el departamento
const fetchMunicipios = async (departamentoId: number) => {
  if (!departamentoId) {
    setMunicipios([]);
    return;
  }
  
  try {
    setLoadingCatalogos(true);
    console.log("Solicitando municipios para departamento:", departamentoId);
    
    const response = await axios.get(`${CATALOGO_API_URL}?listar=municipios&departamento_id=${departamentoId}`);
    if (response.data && Array.isArray(response.data)) {
      console.log("Municipios cargados:", response.data.length);
      setMunicipios(response.data);
    } else {
      console.warn("Respuesta de municipios en formato inesperado:", response.data);
      setMunicipios([]);
    }
  } catch (err: any) {
    console.error('Error al cargar municipios:', err);
    setMunicipios([]);
  } finally {
    setLoadingCatalogos(false);
  }
};

// Manejar cambio en departamento para cargar municipios
const handleDepartamentoChange = (event: SelectChangeEvent) => {
  const deptoId = Number(event.target.value);
  setFormData({...formData, departamento: deptoId, municipio: 0});
  
  // Cargar los municipios para el departamento seleccionado
  fetchMunicipios(deptoId);
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

// Manejador para cambio de pestañas
const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  setTabValue(newValue);
};

// Filtrar personas según búsqueda
const personasFiltradas = personas.filter(persona => {
  const terminoBusqueda = busqueda.toLowerCase();
  return (
    (persona.primer_nombre && persona.primer_nombre.toLowerCase().includes(terminoBusqueda)) ||
    (persona.segundo_nombre && persona.segundo_nombre.toLowerCase().includes(terminoBusqueda)) ||
    (persona.primer_apellido && persona.primer_apellido.toLowerCase().includes(terminoBusqueda)) ||
    (persona.segundo_apellido && persona.segundo_apellido.toLowerCase().includes(terminoBusqueda)) ||
    (persona.identificacion && persona.identificacion.toString().includes(terminoBusqueda)) ||
    (persona.correo_electronico && persona.correo_electronico.toLowerCase().includes(terminoBusqueda))
  );
});

// Filtrar personas según estado (activo/inactivo)
const personasActivas = personasFiltradas.filter(persona => persona.estado_empleado === true);
const personasInactivas = personasFiltradas.filter(persona => persona.estado_empleado === false);

// Obtener nombre completo
const getNombreCompleto = (persona: PersonaData) => {
  return `${persona.primer_nombre} ${persona.segundo_nombre || ''} ${persona.primer_apellido} ${persona.segundo_apellido || ''}`.trim();
};

// Abrir diálogo para crear persona
const handleOpenCreateDialog = () => {
  setFormMode('crear');
  setFormData({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_documento: 0,
    identificacion: 0,
    grupo_sanguineo: 0,
    sexo: 0,
    estado_civil: 0,
    movil: 0,
    departamento: 0,
    municipio: 0,
    direccion: '',
    correo_electronico: '',
    fecha_nacimiento: '',
    estado_empleado: true,
    id_arl: 0,
    id_banco: 0,
    id_tipo_cuenta: 0,
    numero_cta: '',
    id_caja_compensacion: 0
  });
  setMunicipios([]); // Limpiar municipios
  setDialogOpen(true);
};

// Abrir diálogo para editar persona
const handleOpenEditDialog = async (persona: PersonaData) => {
  setFormMode('editar');
  
  // Preparar dato para formulario
  const personaParaFormulario = {
    ...persona,
    // Convertir nulls a valores por defecto para evitar problemas con campos controlados
    segundo_nombre: persona.segundo_nombre || '',
    segundo_apellido: persona.segundo_apellido || '',
    grupo_sanguineo: persona.grupo_sanguineo || 0,
    sexo: persona.sexo || 0,
    estado_civil: persona.estado_civil || 0,
    departamento: persona.departamento || 0,
    municipio: persona.municipio || 0,
    direccion: persona.direccion || '',
    correo_electronico: persona.correo_electronico || '',
    fecha_nacimiento: persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toISOString().split('T')[0] : '',
    id_arl: persona.id_arl || 0,
    id_banco: persona.id_banco || 0,
    id_tipo_cuenta: persona.id_tipo_cuenta || 0,
    numero_cta: persona.numero_cta || '',
    id_caja_compensacion: persona.id_caja_compensacion || 0
  };
  
  setFormData(personaParaFormulario);
  
  // Cargar municipios para el departamento de la persona
  if (persona.departamento) {
    await fetchMunicipios(persona.departamento);
  }
  
  setDialogOpen(true);
};

// Guardar persona (crear o editar)
const handleSavePersona = async () => {
  if (!clienteId) {
    setError('Error: No se ha identificado el ID de la empresa');
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    // Validar campos obligatorios
    const requiredFields = ['primer_nombre', 'primer_apellido', 'tipo_documento', 'identificacion'];
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
      setSuccess(formMode === 'crear' ? 'Persona creada exitosamente' : 'Persona actualizada exitosamente');
      setDialogOpen(false);
      fetchPersonas(); // Recargar la lista de personas
    }
  } catch (err: any) {
    console.error('Error al guardar persona:', err);
    console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
    setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} la persona`);
  } finally {
    setLoading(false);
  }
};

// Eliminar persona
const handleDeletePersona = async (id: number) => {
  if (!clienteId) return;
  
  if (!window.confirm('¿Estás seguro de que deseas eliminar esta persona?')) return;
  
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
      setSuccess('Persona eliminada exitosamente');
      fetchPersonas(); // Recargar la lista de personas
    }
  } catch (err: any) {
    console.error('Error al eliminar persona:', err);
    console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
    setError(err.response?.data?.error || 'Error al eliminar la persona');
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
        <Typography variant="h4">Gestión de Personas</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nueva Persona
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Barra de búsqueda */}
      <Box sx={{ mb: 3, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, apellido, identificación o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
      </Box>
      
      {/* Pestañas para filtrar por estado */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Todos (${personasFiltradas.length})`} />
          <Tab label={`Activos (${personasActivas.length})`} />
          <Tab label={`Inactivos (${personasInactivas.length})`} />
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
                <TableCell>ID</TableCell>
                <TableCell>Identificación</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Correo Electrónico</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tabValue === 0 ? personasFiltradas : 
                tabValue === 1 ? personasActivas : personasInactivas).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No hay personas registradas con los filtros seleccionados</TableCell>
                </TableRow>
              ) : (
                (tabValue === 0 ? personasFiltradas : 
                 tabValue === 1 ? personasActivas : personasInactivas).map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell>{persona.id}</TableCell>
                    <TableCell>{persona.identificacion}</TableCell>
                    <TableCell>{getNombreCompleto(persona)}</TableCell>
                    <TableCell>{persona.correo_electronico}</TableCell>
                    <TableCell>{persona.movil}</TableCell>
                    <TableCell>
                      <Chip 
                        label={persona.estado_empleado ? 'Activo' : 'Inactivo'} 
                        color={persona.estado_empleado ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        color="primary" 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditDialog(persona)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                      <Button 
                        color="error" 
                        size="small" 
                        startIcon={<DeleteIcon />}
                        onClick={() => persona.id && handleDeletePersona(persona.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
    
    {/* Diálogo para crear/editar persona */}
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle>{formMode === 'crear' ? 'Crear Nueva Persona' : 'Editar Persona'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Datos personales */}
          <Typography variant="h6" gutterBottom>Datos Personales</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Primer Nombre"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleTextFieldChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Segundo Nombre"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Primer Apellido"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleTextFieldChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Segundo Apellido"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  name="tipo_documento"
                  value={String(formData.tipo_documento)}
                  onChange={handleSelectChange}
                  label="Tipo de Documento"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {tiposDocumento.map(tipo => (
                    <MenuItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Número de Identificación"
                name="identificacion"
                type="number"
                value={formData.identificacion}
                onChange={handleTextFieldChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={String(formData.sexo)}
                  onChange={handleSelectChange}
                  label="Sexo"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {sexos.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  name="estado_civil"
                  value={String(formData.estado_civil)}
                  onChange={handleSelectChange}
                  label="Estado Civil"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {estadosCiviles.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Grupo Sanguíneo</InputLabel>
                <Select
                  name="grupo_sanguineo"
                  value={String(formData.grupo_sanguineo)}
                  onChange={handleSelectChange}
                  label="Grupo Sanguíneo"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {gruposSanguineos.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Información de contacto */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Información de Contacto</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Teléfono Móvil"
                name="movil"
                type="number"
                value={formData.movil}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Correo Electrónico"
                name="correo_electronico"
                type="email"
                value={formData.correo_electronico}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  name="departamento"
                  value={String(formData.departamento)}
                  onChange={handleDepartamentoChange}
                  label="Departamento"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {departamentos.map(dep => (
                    <MenuItem key={dep.id} value={String(dep.id)}>{dep.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Municipio</InputLabel>
                <Select
                  name="municipio"
                  value={String(formData.municipio)}
                  onChange={handleSelectChange}
                  label="Municipio"
                  disabled={!formData.departamento || loadingCatalogos}
                >
                  <MenuItem value="0">
                    <em>{loadingCatalogos ? "Cargando municipios..." : formData.departamento ? "Seleccione un municipio" : "Seleccione un departamento primero"}</em>
                  </MenuItem>
                  {municipios.map(mun => (
                    <MenuItem key={mun.id} value={String(mun.id)}>{mun.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          {/* Información laboral */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Información Laboral</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>ARL</InputLabel>
                <Select
                  name="id_arl"
                  value={String(formData.id_arl)}
                  onChange={handleSelectChange}
                  label="ARL"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {arls.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Caja de Compensación</InputLabel>
                <Select
                  name="id_caja_compensacion"
                  value={String(formData.id_caja_compensacion)}
                  onChange={handleSelectChange}
                  label="Caja de Compensación"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {cajasCompensacion.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado Empleado</InputLabel>
                <Select
                  name="estado_empleado"
                  value={formData.estado_empleado ? "1" : "0"}
                  onChange={(e) => setFormData({...formData, estado_empleado: e.target.value === "1"})}
                  label="Estado Empleado"
                >
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Información bancaria */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Información Bancaria</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Banco</InputLabel>
                <Select
                  name="id_banco"
                  value={String(formData.id_banco)}
                  onChange={handleSelectChange}
                  label="Banco"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {bancos.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  name="id_tipo_cuenta"
                  value={String(formData.id_tipo_cuenta)}
                  onChange={handleSelectChange}
                  label="Tipo de Cuenta"
                >
                  <MenuItem value="0"><em>Seleccione</em></MenuItem>
                  {tiposCuenta.map(item => (
                    <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Número de Cuenta"
                name="numero_cta"
                value={formData.numero_cta}
                onChange={handleTextFieldChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSavePersona} 
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

export default Persona;