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

interface DeduccionData {
  id?: number;
  id_planilla_detalle: number;
  monto: number;
  id_tipo_deduccion: number;
  tipo_deduccion_nombre?: string;
  [key: string]: any;
}

interface TipoDeduccionItem {
  id: number;
  nombre: string;
}

interface PlanillaDeduccionesProps {
  clienteId: number;
  planillaDetalleId: number;
  nombreEmpleado?: string;
  onDeduccionesChange?: () => void;
}

const DEDUCCIONES_API_URL = 'https://a2pfba123d.execute-api.us-east-1.amazonaws.com/dev/Crud_deducciones';

const PlanillaDeducciones: React.FC<PlanillaDeduccionesProps> = ({ 
  clienteId, 
  planillaDetalleId,
  nombreEmpleado,
  onDeduccionesChange 
}) => {
  // Estado para lista de deducciones
  const [deducciones, setDeducciones] = useState<DeduccionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para el formulario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [formData, setFormData] = useState<DeduccionData>({
    id_planilla_detalle: planillaDetalleId,
    monto: 0,
    id_tipo_deduccion: 0
  });
  
  // Estado para catálogos
  const [tiposDeducciones, setTiposDeducciones] = useState<TipoDeduccionItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  
  // Cargar deducciones cuando cambia el planilla_detalle_id
  useEffect(() => {
    if (clienteId && planillaDetalleId) {
      fetchDeducciones();
      fetchTiposDeducciones();
    }
  }, [clienteId, planillaDetalleId]);
  
  // Función para cargar deducciones
  const fetchDeducciones = async () => {
    if (!clienteId || !planillaDetalleId) return;
    
    try {
      setLoading(true);
      console.log("Solicitando deducciones para planilla_detalle ID:", planillaDetalleId);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer_por_planilla_detalle',
        id_planilla_detalle: planillaDetalleId
      };
      
      console.log("Payload para leer deducciones:", payload);
      
      const response = await axios.post(DEDUCCIONES_API_URL, payload);
      console.log("Respuesta de API (deducciones):", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setDeducciones(response.data);
        console.log("Deducciones cargadas:", response.data.length);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setDeducciones([]);
      }
    } catch (err: any) {
      console.error('Error al cargar deducciones:', err);
      setDeducciones([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar tipos de deducciones
  const fetchTiposDeducciones = async () => {
    if (!clienteId) return;
    
    try {
      setLoadingCatalogos(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'leer_tipos_deducciones'
      };
      
      const response = await axios.post(DEDUCCIONES_API_URL, payload);
      
      if (response.data && Array.isArray(response.data)) {
        setTiposDeducciones(response.data);
      } else {
        setTiposDeducciones([]);
      }
    } catch (err: any) {
      console.error('Error al cargar tipos de deducciones:', err);
      setTiposDeducciones([]);
    } finally {
      setLoadingCatalogos(false);
    }
  };
  
  // Manejador para los cambios de TextField
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monto') {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => ({...prev, [name]: numValue}));
    } else {
      setFormData(prev => ({...prev, [name]: value}));
    }
  };
  
  // Manejador para los Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    
    setFormData(prev => ({...prev, [name]: numValue}));
  };
  
  // Abrir diálogo para crear deducción
  const handleOpenCreateDialog = () => {
    setFormMode('crear');
    setFormData({
      id_planilla_detalle: planillaDetalleId,
      monto: 0,
      id_tipo_deduccion: 0
    });
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar deducción
  const handleOpenEditDialog = (deduccion: DeduccionData) => {
    setFormMode('editar');
    setFormData({...deduccion});
    setDialogOpen(true);
  };
  
  // Guardar deducción (crear o editar)
  const handleSaveDeduccion = async () => {
    if (!clienteId) {
      setError('Error: No se ha identificado el ID de la empresa');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validar campos obligatorios
      const requiredFields = ['id_planilla_detalle', 'monto', 'id_tipo_deduccion'];
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
      
      console.log("Enviando payload de deducción a API:", JSON.stringify(payload, null, 2));
      
      const response = await axios.post(DEDUCCIONES_API_URL, payload);
      
      console.log("Respuesta recibida:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(formMode === 'crear' ? 'Deducción creada exitosamente' : 'Deducción actualizada exitosamente');
        setDialogOpen(false);
        
        // Recargar deducciones
        fetchDeducciones();
        
        // Notificar al componente padre si es necesario
        if (onDeduccionesChange) {
          onDeduccionesChange();
        }
      }
    } catch (err: any) {
      console.error('Error al guardar deducción:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || `Error al ${formMode === 'crear' ? 'crear' : 'actualizar'} la deducción`);
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar deducción
  const handleDeleteDeduccion = async (id: number) => {
    if (!clienteId) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta deducción?')) return;
    
    try {
      setLoading(true);
      
      const payload = {
        cliente_id: clienteId,
        action: 'eliminar',
        id: id
      };
      
      console.log("Enviando payload para eliminar deducción:", payload);
      
      const response = await axios.post(DEDUCCIONES_API_URL, payload);
      console.log("Respuesta de eliminación de deducción:", response.data);
      
      if (response.status === 200) {
        setSuccess('Deducción eliminada exitosamente');
        
        // Recargar deducciones
        fetchDeducciones();
        
        // Notificar al componente padre si es necesario
        if (onDeduccionesChange) {
          onDeduccionesChange();
        }
      }
    } catch (err: any) {
      console.error('Error al eliminar deducción:', err);
      console.error('Detalles del error:', err.response?.data || 'No hay detalles disponibles');
      setError(err.response?.data?.error || 'Error al eliminar la deducción');
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

  // Total de deducciones
  const totalDeducciones = deducciones.reduce((sum, deduccion) => sum + Number(deduccion.monto), 0);

  return (
    <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Deducciones {nombreEmpleado ? `- ${nombreEmpleado}` : ''}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Agregar Deducción
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : deducciones.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ p: 2 }}>
          No hay deducciones registradas para este pago
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tipo de Deducción</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deducciones.map((deduccion) => (
                <TableRow key={deduccion.id}>
                  <TableCell>{deduccion.id}</TableCell>
                  <TableCell>{deduccion.tipo_deduccion_nombre || `ID: ${deduccion.id_tipo_deduccion}`}</TableCell>
                  <TableCell align="right">{formatMoney(Number(deduccion.monto))}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(deduccion)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deduccion.id && handleDeleteDeduccion(deduccion.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                  Total Deducciones:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatMoney(totalDeducciones)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para crear/editar deducción */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formMode === 'crear' ? 'Agregar Deducción' : 'Editar Deducción'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Deducción</InputLabel>
              <Select
                name="id_tipo_deduccion"
                value={String(formData.id_tipo_deduccion || '')}
                onChange={handleSelectChange}
                label="Tipo de Deducción"
              >
                <MenuItem value=""><em>Seleccione</em></MenuItem>
                {tiposDeducciones.map(tipo => (
                  <MenuItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Monto"
              name="monto"
              type="number"
              value={formData.monto}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSaveDeduccion} 
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

export default PlanillaDeducciones;