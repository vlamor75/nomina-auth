// frontend\src\pages\Planilla\PlanillaDetalle\components\EditDialogs.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { TIPOS_HORAS_EXTRAS, RECARGOS_NOCTURNOS, DEDUCCIONES } from '../dataProcessing';

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  data: { [key: string]: number };
  onSave: (newData: { [key: string]: number }) => void;
  title: string;
  items: Array<{ tipo: string; horario?: string; recargo?: number; porcentaje?: number; editable?: boolean }>;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, data, onSave, title, items }) => {
  const [editData, setEditData] = React.useState(data);

  const handleChange = (tipo: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData(prev => ({ ...prev, [tipo]: parseFloat(e.target.value) || 0 }));
  };

  const handleSave = () => {
    onSave(editData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableBody>
            {items.map(item => (
              <TableRow key={item.tipo}>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={editData[item.tipo] || 0}
                    onChange={handleChange(item.tipo)}
                    size="small"
                    fullWidth
                    disabled={item.editable === false}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSave} color="primary" variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export const EditHorasExtrasDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  data: { [key: string]: number };
  onSave: (newData: { [key: string]: number }) => void;
}> = ({ open, onClose, data, onSave }) => (
  <EditDialog
    open={open}
    onClose={onClose}
    data={data}
    onSave={onSave}
    title="Editar Horas Extras"
    items={TIPOS_HORAS_EXTRAS}
  />
);

export const EditRecargosNocturnosDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  data: { [key: string]: number };
  onSave: (newData: { [key: string]: number }) => void;
}> = ({ open, onClose, data, onSave }) => (
  <EditDialog
    open={open}
    onClose={onClose}
    data={data}
    onSave={onSave}
    title="Editar Recargos Nocturnos"
    items={RECARGOS_NOCTURNOS}
  />
);

export const EditDeduccionesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  data: { [key: string]: number };
  onSave: (newData: { [key: string]: number }) => void;
}> = ({ open, onClose, data, onSave }) => (
  <EditDialog
    open={open}
    onClose={onClose}
    data={data}
    onSave={onSave}
    title="Editar Deducciones"
    items={DEDUCCIONES}
  />
);