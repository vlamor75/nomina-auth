import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
}

interface SedeData {
  id?: number;
  nombre: string;
  departamento: number;
  municipio: number;
  direccion: string;
  correo_electronico: string;
  movil: string;
  caja_compensacion: number;
  tipo_sede: number;
  estado: boolean;
  capacidad_empleados?: number;
  horario_atencion?: string;
  fecha_apertura?: string;
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

const API_URL = 'https://9kukgjv9x4.execute-api.us-east-1.amazonaws.com/dev/Crud_sede';
const CATALOGO_API_URL = 'https://whxuvb6me1.execute-api.us-east-1.amazonaws.com/dev/GestionEmpresa';

const Sede: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
  // Estado para la lista de sedes
  const [sedes, setSedes] = useState<SedeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<SedeData>({
    nombre: '',
    departamento: 0,
    municipio: 0,
    direccion: '',
    correo_electronico: '',
    movil: '',
    caja_compensacion: 0,
    tipo_sede: 0,
    estado: true,
    capacidad_empleados: 0,
    horario_atencion: '',
    fecha_apertura: new Date().toISOString().split('T')[0]
  });
  
  // Estado para catálogos
  const [departamentos, setDepartamentos] = useState<CatalogoItem[]>([]);
  const [municipios, setMunicipios] = useState<CatalogoItem[]>([]);
  const [cajas, setCajas] = useState<CatalogoItem[]>([]);
  const [tiposSede, setTiposSede] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar sedes y catálogos cuando el componente se monte
  useEffect(() => {
    if (clienteId) {
      console.log("ID de empresa detectado:", clienteId);
      console.log("Nombre de esquema esperado:", authData.schemaName);
      fetchSedes();
      fetchAllCatalogos();
    }
  }, [clienteId, authData.schemaName]);
  
  // Función para cargar las sedes
  const fetchSedes = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando sedes para cliente_id:", clienteId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer'
      };
      
      console.log("Payload para leer sedes:", payload);
      
      const response = await axios.post(API_URL, payload);
      console.log("Respuesta de API (sedes):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setSedes(response.data);
        console.log("Sedes cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error al cargar las sedes: formato inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar sedes:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al cargar las sedes');
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
      
      // Cargar tipos de sede desde el esquema del cliente
      try {
        const tiposPayload = {
          cliente_id: clienteId,
          action: 'leer_tipos_sede'
        };
        
        console.log("Solicitando tipos de sede para cliente:", clienteId);
        const tiposResponse = await axios.post(API_URL, tiposPayload);
        
        if (tiposResponse.data && Array.isArray(tiposResponse.data)) {
          console.log("Tipos de sede cargados:", tiposResponse.data);
          setTiposSede(tiposResponse.data);
        } else if (tiposResponse.data && tiposResponse.data.error) {
          console.warn('Error al cargar tipos de sede:', tiposResponse.data.error);
          setTiposSede([]);
        } else {
          console.warn('Formato inesperado al cargar tipos de sede');
          setTiposSede([]);
        }
      } catch (error) {
        console.error('No se pudieron cargar los tipos de sede:', error);
        setTiposSede([]);
      }
      
      // Cargar cajas de compensación desde el esquema del cliente
      try {
        const cajasPayload = {
          cliente_id: clienteId,
          action: 'leer_cajas_compensacion'
        };
        
        console.log("Solicitando cajas de compensación para cliente:", clienteId);
        const cajasResponse = await axios.post(API_URL, cajasPayload);
        
        if (cajasResponse.data && Array.isArray(cajasResponse.data)) {
          console.log("Cajas de compensación cargadas:", cajasResponse.data);
          setCajas(cajasResponse.data);
        } else if (cajasResponse.data && cajasResponse.data.error) {
          console.warn('Error al cargar cajas de compensación:', cajasResponse.data.error);
          setCajas([]);
        } else {
          console.warn('Formato inesperado al cargar cajas de compensación');
          setCajas([]);
        }
      } catch (error) {
        console.error('No se pudieron cargar las cajas de compensación:', error);
        setCajas([]);
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
  
  // Abrir diálogo para crear sede
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      nombre: '',
      departamento: 0,
      municipio: 0,
      direccion: '',
      correo_electronico: '',
      movil: '',
      caja_compensacion: 0,
      tipo_sede: 0,
      estado: true,
      capacidad_empleados: 0,
      horario_atencion: '',
      fecha_apertura: new Date().toISOString().split('T')[0]
    });
    setMunicipios([]); // Limpiar municipios
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar sede
  const handleOpenEditDialog = async (sede: SedeData) => {
    setFormMode('editar');
    setFormData({...sede});
    
    // Cargar municipios para el departamento de la sede
    if (sede.departamento) {
      await fetchMunicipios(sede.departamento);
    }
    
    setDialogOpen(true);
  };
  
  // Guardar sede (crear o editar)
  // Guardar sede (crear o editar)
const handleSaveSede = async () => {
  if (!clienteId) {
    setError('Error: No se ha identificado el ID de la empresa');
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    // Validar campos obligatorios
    const requiredFields = ['nombre', 'departamento', 'municipio', 'direccion', 'correo_electronico', 'movil', 'caja_compensacion'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    // Formatear fechas correctamente
    const formattedData = {
      ...formData,
      fecha_apertura: formData.fecha_apertura 
        ? new Date(formData.fecha_apertura).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      fecha_registro: new Date().toISOString().split('T')[0]
    };
    
    // Preparar datos para enviar a la API
    const payload = {
      cliente_id: clienteId,
      action: formMode === 'editar' ? 'modificar' : formMode, // Cambia 'editar' a 'modificar'
      ...formattedData  // Usar formattedData en lugar de formData
    };
    
    console.log("Enviando payload a API:", JSON.stringify(payload, null, 2));
    console.log("ID de empresa usado:", clienteId);
    console.log("Nombre de esquema esperado:", `empresa_${clienteId}`);
    
    const response = await axios.post(API_URL, payload);
    
    console.log("Respuesta recibida:", response.data);
    
    if (response.status === 200 || response.status === 201) {
      setSuccess(formMode === 'crear' ? 'Sede creada exitosamente' : 'Sede actualizada exitosamente');
      setDialogOpen(false);
      fetchSedes(); // Recargar la lista de sedes
    }
  } catch (err: any) {
    console.error('Error al guardar sede:', err);
    console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
    setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} la sede`);
  } finally {
    setLoading(false);
  }
};
  
  // Eliminar sede
  const handleDeleteSede = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sede?')) return;
    
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
        setSuccess('Sede eliminada exitosamente');
        fetchSedes(); // Recargar la lista de sedes
      }
    } catch (err: any) {
      console.error('Error al eliminar sede:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar la sede');
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
          <Typography variant="h4">Gestión de Sedes</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Nueva Sede
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
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Correo Electrónico</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sedes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No hay sedes registradas</TableCell>
                  </TableRow>
                ) : (
                  sedes.map((sede) => (
                    <TableRow key={sede.id}>
                      <TableCell>{sede.id}</TableCell>
                      <TableCell>{sede.nombre}</TableCell>
                      <TableCell>{sede.direccion}</TableCell>
                      <TableCell>{sede.correo_electronico}</TableCell>
                      <TableCell>{sede.movil}</TableCell>
                      <TableCell>{sede.estado ? 'Activa' : 'Inactiva'}</TableCell>
                      <TableCell>
                        <Button 
                          color="primary" 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(sede)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          color="error" 
                          size="small" 
                          startIcon={<DeleteIcon />}
                          onClick={() => sede.id && handleDeleteSede(sede.id)}
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
      
      {/* Diálogo para crear/editar sede */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{formMode === 'crear' ? 'Crear Nueva Sede' : 'Editar Sede'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre de la Sede"
              name="nombre"
              value={formData.nombre}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
            />
            
            <TextField
              label="Correo Electrónico"
              name="correo_electronico"
              type="email"
              value={formData.correo_electronico}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
            />
            
            <TextField
              label="Teléfono"
              name="movil"
              value={formData.movil}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
            />
            
            <FormControl fullWidth required>
              <InputLabel>Tipo de Sede</InputLabel>
              <Select
                name="tipo_sede"
                value={String(formData.tipo_sede)}
                onChange={handleSelectChange}
                label="Tipo de Sede"
              >
                <MenuItem value="0"><em>Seleccione</em></MenuItem>
                {tiposSede.map(tipo => (
                  <MenuItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
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
            
            <FormControl fullWidth required>
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
            
            <TextField
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
            />
            
            <FormControl fullWidth required>
              <InputLabel>Caja de Compensación</InputLabel>
              <Select
                name="caja_compensacion"
                value={String(formData.caja_compensacion)}
                onChange={handleSelectChange}
                label="Caja de Compensación"
              >
                <MenuItem value="0"><em>Seleccione</em></MenuItem>
                {cajas.map(caja => (
                  <MenuItem key={caja.id} value={String(caja.id)}>{caja.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Capacidad de Empleados"
              name="capacidad_empleados"
              type="number"
              value={formData.capacidad_empleados}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Horario de Atención"
              name="horario_atencion"
              value={formData.horario_atencion}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
              placeholder="Ej: Lunes a Viernes 8:00 AM - 5:00 PM"
            />
            
            <TextField
              label="Fecha de Apertura"
              name="fecha_apertura"
              type="date"
              value={formData.fecha_apertura}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={formData.estado ? "1" : "0"}
                onChange={(e) => setFormData({...formData, estado: e.target.value === "1"})}
                label="Estado"
              >
                <MenuItem value="1">Activa</MenuItem>
                <MenuItem value="0">Inactiva</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSaveSede} 
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

export default Sede;