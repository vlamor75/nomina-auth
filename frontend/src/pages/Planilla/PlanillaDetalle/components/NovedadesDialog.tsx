// frontend\src\pages\Planilla\PlanillaDetalle\components\NovedadesDialog.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { PlanillaDetalleData, HoraExtraType, RecargoNocturnoType, DeduccionType } from '../types';
import { TIPOS_HORAS_EXTRAS, RECARGOS_NOCTURNOS, DEDUCCIONES, formatMoney } from '../dataProcessing';

interface NovedadesDialogProps {
  open: boolean;
  onClose: () => void;
  formData: PlanillaDetalleData;
  horasExtrasData: { [key: string]: number };
  recargosNocturnosData: { [key: string]: number };
  deduccionesData: { [key: string]: number };
  onEditHorasExtras: () => void;
  onEditRecargosNocturnos: () => void;
  onEditDeducciones: () => void;
}

const NovedadesDialog: React.FC<NovedadesDialogProps> = ({
  open,
  onClose,
  formData,
  horasExtrasData,
  recargosNocturnosData,
  deduccionesData,
  onEditHorasExtras,
  onEditRecargosNocturnos,
  onEditDeducciones,
}) => {
  const [tabValue, setTabValue] = React.useState('ingresos');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Gestión de Novedades</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Ingresos" value="ingresos" />
          <Tab label="Deducciones" value="deducciones" />
        </Tabs>

        {tabValue === 'ingresos' && (
          <Box>
            <Typography variant="subtitle1">Horas Extras</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Recargo</TableCell>
                  <TableCell>Horas</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TIPOS_HORAS_EXTRAS.map((horaExtra: HoraExtraType) => (
                  <TableRow key={horaExtra.tipo}>
                    <TableCell>{horaExtra.tipo}</TableCell>
                    <TableCell>{horaExtra.horario}</TableCell>
                    <TableCell>{(horaExtra.recargo * 100).toFixed(0)}%</TableCell>
                    <TableCell>{horasExtrasData[horaExtra.tipo]}</TableCell>
                    <TableCell>{formatMoney(horasExtrasData[horaExtra.tipo] * (formData.salario_base / 240) * (1 + horaExtra.recargo))}</TableCell>
                    <TableCell>
                      <Button startIcon={<EditIcon />} onClick={onEditHorasExtras}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Recargos Nocturnos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Recargo</TableCell>
                  <TableCell>Horas</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {RECARGOS_NOCTURNOS.map((recargo: RecargoNocturnoType) => (
                  <TableRow key={recargo.tipo}>
                    <TableCell>{recargo.tipo}</TableCell>
                    <TableCell>{recargo.horario}</TableCell>
                    <TableCell>{(recargo.recargo * 100).toFixed(0)}%</TableCell>
                    <TableCell>{recargosNocturnosData[recargo.tipo]}</TableCell>
                    <TableCell>{formatMoney(recargosNocturnosData[recargo.tipo] * (formData.salario_base / 240) * recargo.recargo)}</TableCell>
                    <TableCell>
                      <Button startIcon={<EditIcon />} onClick={onEditRecargosNocturnos}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {tabValue === 'deducciones' && (
          <Box>
            <Typography variant="subtitle1">Deducciones</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Porcentaje</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DEDUCCIONES.map((deduccion: DeduccionType) => (
                  <TableRow key={deduccion.tipo}>
                    <TableCell>{deduccion.tipo}</TableCell>
                    <TableCell>{deduccion.porcentaje ? `${(deduccion.porcentaje * 100).toFixed(0)}%` : 'Variable'}</TableCell>
                    <TableCell>{formatMoney(deduccionesData[deduccion.tipo])}</TableCell>
                    <TableCell>
                      {deduccion.editable && (
                        <Button startIcon={<EditIcon />} onClick={onEditDeducciones}>Editar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NovedadesDialog;