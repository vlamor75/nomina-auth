// frontend\src\pages\Planilla\PlanillaDetalle\components\DialogForm.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import { PlanillaDetalleData, PersonaItem, CatalogoItem, ContratoItem } from '../types';
import { calculateTotalIngresos } from '../dataProcessing';

interface DialogFormProps {
  open: boolean;
  onClose: () => void;
  formMode: 'crear' | 'editar';
  formData: PlanillaDetalleData;
  personas: PersonaItem[];
  tiposPago: CatalogoItem[];
  contratosPorPersona: ContratoItem[];
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => void;
  onOpenNovedades: () => void;
}

const DialogForm: React.FC<DialogFormProps> = ({
  open,
  onClose,
  formMode,
  formData,
  personas,
  tiposPago,
  contratosPorPersona,
  onSave,
  onChange,
  onOpenNovedades,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{formMode === 'crear' ? 'Agregar Pago' : 'Editar Pago'}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
        <FormControl fullWidth required>
          <InputLabel>Empleado</InputLabel>
          <Select name="id_persona" value={String(formData.id_persona || '')} onChange={onChange} label="Empleado">
            <MenuItem value=""><em>Seleccione</em></MenuItem>
            {personas.map(persona => (
              <MenuItem key={persona.id} value={String(persona.id)}>{persona.nombre_completo}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel>Tipo de Pago</InputLabel>
          <Select name="id_tipo_pago" value={String(formData.id_tipo_pago || '')} onChange={onChange} label="Tipo de Pago">
            <MenuItem value=""><em>Seleccione</em></MenuItem>
            {tiposPago.map(tipo => (
              <MenuItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel>Contrato</InputLabel>
          <Select name="id_contrato" value={String(formData.id_contrato || '')} onChange={onChange} label="Contrato">
            <MenuItem value=""><em>Seleccione</em></MenuItem>
            {contratosPorPersona.map(contrato => (
              <MenuItem key={contrato.id} value={String(contrato.id)}>{contrato.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Salario Base"
          name="salario_base"
          type="number"
          value={formData.salario_base}
          onChange={onChange}
          fullWidth
          required
        />
        <TextField
          label="Días a Pagar"
          name="dias_a_pagar"
          type="number"
          value={formData.dias_a_pagar}
          onChange={onChange}
          fullWidth
          required
          InputProps={{ inputProps: { min: 0, max: 30 } }}
        />
        <TextField
          label="Auxilio"
          name="auxilio"
          type="number"
          value={formData.auxilio}
          onChange={onChange}
          fullWidth
        />
        <Box sx={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onOpenNovedades}>Gestionar Novedades</Button>
        </Box>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">Cancelar</Button>
      <Button onClick={onSave} color="primary" variant="contained">Guardar</Button>
    </DialogActions>
  </Dialog>
);

export default DialogForm;