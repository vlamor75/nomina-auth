// frontend\src\pages\Planilla\PlanillaDetalle\api.ts
import axios from 'axios';
import { PlanillaDetalleData, PersonaItem, CatalogoItem, ContratoItem } from './types';

const PLANILLA_DETALLE_API_URL = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';
const CONTRATO_API_URL = 'https://p57h6xk7al.execute-api.us-east-1.amazonaws.com/dev/crud_contrato';

export const fetchPlanillaDetalles = async (clienteId: number, planillaId: number): Promise<PlanillaDetalleData[]> => {
  const payload = { cliente_id: clienteId, action: 'leer', id_planilla: planillaId };
  const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
  return response.data && Array.isArray(response.data) ? response.data : [];
};

export const saveDetalle = async (clienteId: number, formData: PlanillaDetalleData, formMode: 'crear' | 'editar') => {
  const payload = {
    cliente_id: clienteId,
    action: formMode === 'editar' ? 'modificar' : 'crear',
    id: formMode === 'editar' ? formData.id : undefined,
    ...formData,
  };
  const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
  return response;
};

export const deleteDetalle = async (clienteId: number, id: number) => {
  const payload = { cliente_id: clienteId, action: 'eliminar', id };
  const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
  return response;
};

export const fetchCatalogosDetalle = async (clienteId: number): Promise<{
  personas: PersonaItem[];
  tiposPago: CatalogoItem[];
}> => {
  const personasPayload = { cliente_id: clienteId, action: 'leer_personas' };
  const tiposPagoPayload = { cliente_id: clienteId, action: 'leer_tipos_pago' };

  const [personasResponse, tiposPagoResponse] = await Promise.all([
    axios.post(PLANILLA_DETALLE_API_URL, personasPayload),
    axios.post(PLANILLA_DETALLE_API_URL, tiposPagoPayload),
  ]);

  return {
    personas: personasResponse.data && Array.isArray(personasResponse.data) ? personasResponse.data : [],
    tiposPago: tiposPagoResponse.data && Array.isArray(tiposPagoResponse.data) ? tiposPagoResponse.data : [],
  };
};

export const fetchContratosPorPersona = async (clienteId: number, personaId: number): Promise<ContratoItem[]> => {
  const payload = { cliente_id: clienteId, action: 'leer_contratos', id_persona: personaId };
  const response = await axios.post(PLANILLA_DETALLE_API_URL, payload);
  return response.data && Array.isArray(response.data) ? response.data : [];
};

export const fetchContratoDetails = async (clienteId: number, contratoId: number, personaId: number): Promise<ContratoItem | null> => {
  const payload = { cliente_id: clienteId, action: 'leer', id_persona: personaId };
  const response = await axios.post(CONTRATO_API_URL, payload);
  if (response.data && Array.isArray(response.data)) {
    return response.data.find((contrato: ContratoItem) => contrato.id === contratoId) || null;
  }
  return null;
};

export const fetchContratosActivos = async (clienteId: number): Promise<ContratoItem[]> => {
  const payload = { cliente_id: clienteId, action: 'leer' };
  const response = await axios.post(CONTRATO_API_URL, payload);
  return response.data && Array.isArray(response.data) ? response.data.filter(c => c.estado) : [];
};