import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import PlanillaCabecera from './Planilla/PlanillaCabecera';

// Interfaces
interface AuthData {
  empresaId?: number;
  email?: string;
  schemaName?: string;
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

const PlanillaModular: React.FC = () => {
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
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
        <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Planillas</Typography>
        
        {/* Aquí se muestra el componente PlanillaCabecera directamente */}
        <PlanillaCabecera clienteId={clienteId} />
      </Box>
    </DashboardLayout>
  );
};

export default PlanillaModular;