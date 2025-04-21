// frontend\src\pages\Planilla\PlanillaDetalle\components\DetalleTable.tsx
import React from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { PlanillaDetalleData } from '../types';
import { formatMoney } from '../dataProcessing';
import { containerStyles } from '../styles';

interface DetalleTableProps {
  planillaDetalles: PlanillaDetalleData[];
  loading: boolean;
  error: string | null;
  success: string | null;
  onCreate: () => void;
  onEdit: (detalle: PlanillaDetalleData) => void;
  onDelete: (id: number) => void;
  onLoadContracts: () => void;
}

const DetalleTable: React.FC<DetalleTableProps> = ({
  planillaDetalles,
  loading,
  error,
  success,
  onCreate,
  onEdit,
  onDelete,
  onLoadContracts,
}) => (
  <Box sx={containerStyles}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6">Detalles de la planilla</Typography>
      <Box>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={onCreate} sx={{ mr: 1 }}>
          Agregar Pago Individual
        </Button>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onLoadContracts}>
          Cargar Todos los Contratos Activos
        </Button>
      </Box>
    </Box>

    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    ) : planillaDetalles.length === 0 ? (
      <Typography variant="body1" align="center" sx={{ p: 2 }}>
        No hay detalles de pago registrados
      </Typography>
    ) : (
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Tipo de Pago</TableCell>
              <TableCell align="right">Salario Base</TableCell>
              <TableCell align="right">Días a Pagar</TableCell>
              <TableCell align="right">Auxilio</TableCell>
              <TableCell align="right">Horas Extras</TableCell>
              <TableCell align="right">Recargo Noc.</TableCell>
              <TableCell align="right">Total Deducciones</TableCell>
              <TableCell align="right">Pago Neto</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {planillaDetalles.map(detalle => {
              const totalDeductions = (detalle.salud_empleado || 0) + (detalle.pension_empleado || 0) + (detalle.embargo || 0) +
                (detalle.otros_descuentos || 0) + (detalle.prestamo_empresa || 0) + (detalle.retencion_en_la_fuente || 0);
              return (
                <TableRow key={detalle.id}>
                  <TableCell>{detalle.nombre_completo || `ID: ${detalle.id_persona}`}</TableCell>
                  <TableCell>{detalle.tipo_pago_nombre || `ID: ${detalle.id_tipo_pago}`}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.salario_base)}</TableCell>
                  <TableCell align="right">{detalle.dias_a_pagar}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.auxilio)}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.valor_total_horas_extras)}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.recargo_nocturno)}</TableCell>
                  <TableCell align="right">{formatMoney(totalDeductions)}</TableCell>
                  <TableCell align="right">{formatMoney(detalle.pago_neto)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => onEdit(detalle)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => detalle.id && onDelete(detalle.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Box>
);

export default DetalleTable;