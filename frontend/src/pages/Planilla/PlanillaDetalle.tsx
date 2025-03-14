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
  Delete as DeleteIcon
} from '@mui/icons-material';

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

interface PersonaItem {
  id: number;
  nombre_completo: string;
}

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface PlanillaDetalleProps {
  clienteId: number;
  planillaId: number;
}

const PLANILLA_DETALLE_API_URL = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';

const PlanillaDetalle: React.FC<PlanillaDetalleProps> = ({ clienteId, planillaId }) => {
  // Estado para lista de detalles
  const [planillaDetalles, setPlanillaDetalles] = useState<PlanillaDetalleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<PlanillaDetalleData>({
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
  
  // Catálogos para detalle
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [contratos, setContratos] = useState<CatalogoItem[]>([]);
  const [tiposPago, setTiposPago] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar detalles al montar el componente o cambiar la planilla seleccionada
  useEffect(() => {
    if (clienteId && planillaId) {
      fetchPlanillaDetalles();
    }
  }, [clienteId, planillaId]);
  
  // Función para cargar detalles de una planilla
  const fetchPlanillaDetalles = async () => {
    if (!clienteId || !planillaId) return;
    
    try {
      setLoading(true);
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
      setLoading(false);
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
  
  // Manejador para los cambios de TextField en detalle
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, convertir a número
    if (['salario_base', 'dias_a_pagar', 'auxilio', 'horas_extras', 'recargos_nocturnos'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => {
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
      setFormData(prev => ({...prev, [name]: value}));
    }
  };
  
  // Manejador para los Select en detalle
  // Manejador para los Select en detalle
 const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    
    setFormData(prev => ({...prev, [name]: numValue}));
    
    // Si cambia la persona, cargar sus contratos
    if (name === 'id_persona' && numValue > 0) {
      fetchContratosPorPersona(numValue);
    }
  };
  
  // Abrir diálogo para crear detalle de planilla
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
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
    setContratos([]);
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar detalle de planilla
  const handleOpenEditDialog = (detalle: PlanillaDetalleData) => {
    setFormMode('editar');
    setFormData({...detalle});
    fetchCatalogosDetalle();
    if (detalle.id_persona) {
      fetchContratosPorPersona(detalle.id_persona);
    }
    setDialogOpen(true);
  };
  
  // Guardar detalle de planilla (crear o editar)
  const handleSaveDetalle = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validar campos obligatorios
      const requiredFields = ['id_planilla', 'id_persona', 'salario_base', 'dias_a_pagar', 'id_contrato', 'id_tipo_pago'];
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
      
      console.log("Enviando payload de detalle a API:", JSON.stringify(payload, null, 2));
      
      const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
      
      console.log("Respuesta recibida:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'crear' ? 'Detalle creado exitosamente' : 'Detalle actualizado exitosamente');
        setDialogOpen(false);
        
        // Recargar detalles de la planilla actual
        fetchPlanillaDetalles();
      }
    } catch (err: any) {
      console.error('Error al guardar detalle:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} el detalle`);
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar detalle de planilla
  const handleDeleteDetalle = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar este detalle de planilla?')) return;
    
    try {
      setLoading(true);
      
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
        fetchPlanillaDetalles();
      }
    } catch (err: any) {
      console.error('Error al eliminar detalle:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar el detalle');
    } finally {
      setLoading(false);
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
      
      {/* Diálogo para crear/editar detalle de planilla */}
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
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
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
            
            <TextField
              label="Auxilio"
              name="auxilio"
              type="number"
              value={formData.auxilio}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Horas Extras"
              name="horas_extras"
              type="number"
              value={formData.horas_extras}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Recargos Nocturnos"
              name="recargos_nocturnos"
              type="number"
              value={formData.recargos_nocturnos}
              onChange={handleTextFieldChange}
              fullWidth
              variant="outlined"
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
    </Box>
  );
 };
 
 export default PlanillaDetalle;