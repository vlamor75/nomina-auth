// frontend\src\pages\Planilla\PlanillaDetalle\index.tsx
import React from 'react';
import { usePlanillaDetalle } from './hooks/usePlanillaDetalle';
import DetalleTable from './components/DetalleTable';
import DialogForm from './components/DialogForm';
import NovedadesDialog from './components/NovedadesDialog';
import { EditHorasExtrasDialog, EditRecargosNocturnosDialog, EditDeduccionesDialog } from './components/EditDialogs';
import { PlanillaDetalleData } from './types';

interface PlanillaDetalleProps {
  clienteId: number;
  planillaId: number;
}

const PlanillaDetalle: React.FC<PlanillaDetalleProps> = ({ clienteId, planillaId }) => {
  const {
    planillaDetalles,
    loading,
    error,
    success,
    dialogOpen,
    setDialogOpen,
    formMode,
    formData,
    setFormData,
    personas,
    tiposPago,
    contratosPorPersona,
    novedadesDialogOpen,
    setNovedadesDialogOpen,
    editHorasExtrasOpen,
    setEditHorasExtrasOpen,
    editRecargosNocturnosOpen,
    setEditRecargosNocturnosOpen,
    editDeduccionesOpen,
    setEditDeduccionesOpen,
    horasExtrasData,
    setHorasExtrasData,
    recargosNocturnosData,
    setRecargosNocturnosData,
    deduccionesData,
    setDeduccionesData,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleSaveDetalle,
    handleDeleteDetalle,
    cargarContratosActivos,
  } = usePlanillaDetalle(clienteId, planillaId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name.includes('id') ? Number(value) : value }));
  };

  return (
    <>
      <DetalleTable
        planillaDetalles={planillaDetalles}
        loading={loading}
        error={error}
        success={success}
        onCreate={handleOpenCreateDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteDetalle}
        onLoadContracts={cargarContratosActivos}
      />
      <DialogForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        formMode={formMode}
        formData={formData}
        personas={personas}
        tiposPago={tiposPago}
        contratosPorPersona={contratosPorPersona}
        onSave={handleSaveDetalle}
        onChange={handleChange}
        onOpenNovedades={() => setNovedadesDialogOpen(true)}
      />
      <NovedadesDialog
        open={novedadesDialogOpen}
        onClose={() => setNovedadesDialogOpen(false)}
        formData={formData}
        horasExtrasData={horasExtrasData}
        recargosNocturnosData={recargosNocturnosData}
        deduccionesData={deduccionesData}
        onEditHorasExtras={() => setEditHorasExtrasOpen(true)}
        onEditRecargosNocturnos={() => setEditRecargosNocturnosOpen(true)}
        onEditDeducciones={() => setEditDeduccionesOpen(true)}
      />
      <EditHorasExtrasDialog
        open={editHorasExtrasOpen}
        onClose={() => setEditHorasExtrasOpen(false)}
        data={horasExtrasData}
        onSave={setHorasExtrasData}
      />
      <EditRecargosNocturnosDialog
        open={editRecargosNocturnosOpen}
        onClose={() => setEditRecargosNocturnosOpen(false)}
        data={recargosNocturnosData}
        onSave={setRecargosNocturnosData}
      />
      <EditDeduccionesDialog
        open={editDeduccionesOpen}
        onClose={() => setEditDeduccionesOpen(false)}
        data={deduccionesData}
        onSave={setDeduccionesData}
      />
    </>
  );
};

export default PlanillaDetalle;