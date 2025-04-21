// /pages/Dashboard/api.ts
import axios from 'axios';
import { useState, useEffect } from 'react';
import { AuthData } from './types';

export const API_URL_CONTRATOS = 'https://p57h6xk7al.execute-api.us-east-1.amazonaws.com/dev/crud_contrato';
export const API_URL_PLANILLA = 'https://i8vay3901d.execute-api.us-east-1.amazonaws.com/dev/Crud_planilla';
export const API_URL_PLANILLA_DETALLE = 'https://fp35pmt31d.execute-api.us-east-1.amazonaws.com/dev/crud_planilla_detalle';
export const API_URL_PERSONA = 'https://ujjv8lyoo2.execute-api.us-east-1.amazonaws.com/dev/crud_persona';

// Hook para obtener datos de autenticación
export const useAuth = (): { data: AuthData; loading: boolean; error: string | null } => {
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