import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';

// Hook para obtener datos del usuario autenticado desde el backend
interface AuthData {
  email: string;
  name?: string;
  nickname?: string;
  phone_number?: string;
}

const useAuth = (): { data: AuthData; loading: boolean; error: string | null } => {
  const [authData, setAuthData] = useState<AuthData>({
    email: '',
    name: '',
    nickname: '',
    phone_number: '',
  });
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        console.log('Solicitando datos de autenticación a /api/auth/me...');
        const response = await axios.get('http://localhost:3001/api/auth/me', { withCredentials: true });
        console.log('Respuesta de /api/auth/me:', response.data);
        if (response.data.isAuthenticated) {
          setAuthData({
            email: response.data.userInfo.email,
            name: response.data.userInfo.name,
            nickname: response.data.userInfo.nickname,
            phone_number: response.data.userInfo.phone_number,
          });
        } else {
          setErrorAuth('No estás autenticado. Por favor, inicia sesión.');
        }
      } catch (err: unknown) {
        const error = err as any;
        console.error('Error al obtener datos de autenticación:', error.response?.data || error.message);
        setErrorAuth(error.response?.data?.error || 'Error al obtener datos de autenticación.');
      } finally {
        setLoadingAuth(false);
      }
    };

    fetchAuthData();
  }, []);

  return { data: authData, loading: loadingAuth, error: errorAuth };
};

const API_URL = 'https://whxuvb6me1.execute-api.us-east-1.amazonaws.com/dev/GestionEmpresa';

const Empresa: React.FC = () => {
  const navigate = useNavigate();
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const userEmail = authData.email || '';
  const userName = authData.name || '';
  const userPhone = authData.phone_number || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: userName, // Prellenar con el nombre del usuario autenticado
    email: userEmail, // Prellenar con el email de Cognito
    celular: userPhone, // Prellenar con el teléfono del usuario autenticado
    direccion: '',
    nit: '',
    departamento_id: '',
    municipio_id: '',
    tipo_empresa_id: '',
  });
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ id: number; nombre: string }[]>([]);
  const [tiposEmpresa, setTiposEmpresa] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [existingEmpresa, setExistingEmpresa] = useState<any>(null);

  // Actualizar formData cuando userEmail cambie
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      email: userEmail,
      contacto: userName,
      celular: userPhone,
    }));
  }, [userEmail, userName, userPhone]);

  // 📌 Carga inicial: verificar empresa existente y datos
  useEffect(() => {
    if (loadingAuth || errorAuth || !userEmail) return; // Esperar a que la autenticación termine

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log("Iniciando carga de datos iniciales...");

        // Verificar si ya existe una empresa con el email del usuario
        console.log("Verificando empresa existente con email:", userEmail);
        try {
          const empresaResponse = await axios.get(`${API_URL}?email=${encodeURIComponent(userEmail)}`);
          if (empresaResponse.status === 200 && empresaResponse.data) {
            setExistingEmpresa(empresaResponse.data);
            setFormData(empresaResponse.data); // Precargar datos
            console.log("Empresa existente encontrada:", empresaResponse.data);
          }
        } catch (err: unknown) {
          const error = err as any;
          if (error.response?.status !== 404) {
            console.error("Error al verificar empresa existente:", error);
            setError("Error al verificar si ya existe una empresa.");
            return;
          }
        }

        // Cargar departamentos y tipos de empresa
        console.log("Solicitando departamentos...");
        const departamentosResponse = await axios.get(`${API_URL}?listar=departamentos`);
        console.log("Departamentos recibidos:", departamentosResponse.data);
        setDepartamentos(departamentosResponse.data);

        console.log("Solicitando tipos de empresa...");
        const tiposResponse = await axios.get(`${API_URL}?listar=tipos_empresa`);
        console.log("Tipos de empresa recibidos:", tiposResponse.data);
        setTiposEmpresa(tiposResponse.data);

        setMunicipios([]);
      } catch (err: unknown) {
        const error = err as any;
        console.error('Error al cargar datos iniciales:', error);
        setError(error.response?.data?.error || 'No se pudieron cargar los datos iniciales.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [userEmail, loadingAuth, errorAuth]);

  // 📌 Carga de municipios
  useEffect(() => {
    const fetchMunicipios = async () => {
      if (formData.departamento_id) {
        try {
          setLoadingMunicipios(true);
          const url = `${API_URL}?listar=municipios&departamento_id=${formData.departamento_id}`;
          console.log("Solicitando municipios a:", url);
          const response = await axios.get(url);
          console.log("Municipios recibidos:", response.data);
          setMunicipios(response.data);
        } catch (err: unknown) {
          const error = err as any;
          console.error('Error al cargar municipios:', error);
          setError(error.response?.data?.error || 'No se pudieron cargar los municipios.');
        } finally {
          setLoadingMunicipios(false);
        }
      } else {
        setMunicipios([]);
        setFormData((prev) => ({ ...prev, municipio_id: '' }));
      }
    };

    fetchMunicipios();
  }, [formData.departamento_id]);

  // 📌 Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name !== 'email') { // Evitar cambios en el email
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 📌 Manejar cambios en los dropdowns
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name && name !== 'email') { // Evitar cambios en el email
      console.log(`Seleccionado ${name}:`, value);
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 📌 Crear o actualizar empresa
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const requiredFields = [
        { key: 'empresa', label: 'Nombre de la Empresa' },
        { key: 'contacto', label: 'Contacto' },
        { key: 'email', label: 'Email' },
        { key: 'celular', label: 'Celular' },
        { key: 'direccion', label: 'Dirección' },
        { key: 'departamento_id', label: 'Departamento' },
        { key: 'municipio_id', label: 'Municipio' },
        { key: 'tipo_empresa_id', label: 'Tipo de Empresa' },
      ];
      for (const field of requiredFields) {
        if (!formData[field.key as keyof typeof formData]) {
          setError(`⚠️ El campo ${field.label} es obligatorio.`);
          return;
        }
      }

      const dataToSubmit = {
        ...formData,
        departamento_id: parseInt(formData.departamento_id, 10),
        municipio_id: parseInt(formData.municipio_id, 10),
        tipo_empresa_id: parseInt(formData.tipo_empresa_id, 10),
      };

      if (existingEmpresa) {
        // Actualizar empresa existente
        console.log("Actualizando empresa con datos:", JSON.stringify(dataToSubmit, null, 2));
        const response = await axios.put(API_URL, { ...dataToSubmit, id: existingEmpresa.id });
        console.log("Respuesta de actualización:", response.data);
        setSuccess("Empresa actualizada exitosamente.");
      } else {
        // Crear nueva empresa
        console.log("Enviando datos para crear empresa:", JSON.stringify(dataToSubmit, null, 2));
        const response = await axios.post(API_URL, dataToSubmit);
        console.log("Respuesta de creación:", response.data);
        setSuccess("Empresa registrada exitosamente.");
        setExistingEmpresa(response.data); // Guardar la empresa creada
      }

      // Redirigir al Dashboard después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      const error = err as any;
      console.error('Error al guardar empresa:', JSON.stringify(error.response?.data || error, null, 2));
      setError(error.response?.data?.error || 'No se pudo guardar la empresa.');
    } finally {
      setLoading(false);
    }
  };

  // 📌 Eliminar empresa
  const handleDelete = async () => {
    if (!existingEmpresa) return;

    try {
      setLoading(true);
      setError(null);
      console.log("Eliminando empresa con ID:", existingEmpresa.id);
      const response = await axios.delete(`${API_URL}?id=${existingEmpresa.id}`);
      console.log("Respuesta de eliminación:", response.data);
      setSuccess("Empresa eliminada exitosamente.");
      setExistingEmpresa(null);
      setFormData({
        empresa: '',
        contacto: userName, // Mantener el nombre del usuario autenticado
        email: userEmail, // Mantener el email del usuario
        celular: userPhone, // Mantener el teléfono del usuario autenticado
        direccion: '',
        nit: '',
        departamento_id: '',
        municipio_id: '',
        tipo_empresa_id: '',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      const error = err as any;
      console.error('Error al eliminar empresa:', error);
      setError(error.response?.data?.error || 'No se pudo eliminar la empresa.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar estado de carga o error de autenticación
  if (loadingAuth) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Cargando datos de autenticación...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (errorAuth) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: '600px', margin: '20px auto' }}>
          <Alert severity="error">{errorAuth}</Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 2, maxWidth: '600px', margin: '20px auto' }}>
        <Typography variant="h4">{existingEmpresa ? 'Editar Empresa' : 'Registrar Empresa'}</Typography>
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <TextField fullWidth label="Nombre de la Empresa" name="empresa" value={formData.empresa} onChange={handleChange} variant="outlined" margin="normal" required />
        <TextField fullWidth label="Contacto" name="contacto" value={formData.contacto} onChange={handleChange} variant="outlined" margin="normal" required />
        <TextField fullWidth label="Email" name="email" type="email" value={formData.email} variant="outlined" margin="normal" required disabled />
        <TextField fullWidth label="Celular" name="celular" value={formData.celular} onChange={handleChange} variant="outlined" margin="normal" required />
        <TextField fullWidth label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} variant="outlined" margin="normal" required />
        <TextField fullWidth label="NIT" name="nit" value={formData.nit} onChange={handleChange} variant="outlined" margin="normal" />

        <FormControl fullWidth variant="outlined" margin="normal" required>
          <InputLabel>Departamento</InputLabel>
          <Select name="departamento_id" value={formData.departamento_id} onChange={handleSelectChange} label="Departamento" disabled={loading}>
            <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
            {departamentos.map((dep) => (
              <MenuItem key={dep.id} value={dep.id.toString()}>{dep.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal" required>
          <InputLabel>Municipio</InputLabel>
          <Select name="municipio_id" value={formData.municipio_id} onChange={handleSelectChange} label="Municipio" disabled={!formData.departamento_id || loadingMunicipios || loading}>
            <MenuItem value="">
              <em>{loadingMunicipios ? "Cargando municipios..." : formData.departamento_id ? "Seleccione un municipio" : "Seleccione un departamento primero"}</em>
            </MenuItem>
            {municipios.map((mun) => (
              <MenuItem key={mun.id} value={mun.id.toString()}>{mun.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal" required>
          <InputLabel>Tipo de Empresa</InputLabel>
          <Select name="tipo_empresa_id" value={formData.tipo_empresa_id} onChange={handleSelectChange} label="Tipo de Empresa" disabled={loading}>
            <MenuItem value=""><em>Seleccione un tipo de empresa</em></MenuItem>
            {tiposEmpresa.map((tipo) => (
              <MenuItem key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : existingEmpresa ? 'Actualizar Empresa' : 'Crear Empresa'}
          </Button>
          {existingEmpresa && (
            <Button variant="outlined" color="error" fullWidth onClick={handleDelete} disabled={loading}>
              Eliminar Empresa
            </Button>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default Empresa;