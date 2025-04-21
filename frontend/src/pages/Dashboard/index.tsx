// /pages/Dashboard/index.tsx
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider, Tooltip, useMediaQuery, Card, CardContent, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Home as HomeIcon, Business as BusinessIcon, Person as PersonIcon, LocationCity as LocationCityIcon, Assignment as AssignmentIcon, Description as DescriptionIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement, LineElement, PointElement, Filler } from 'chart.js';
import { Link } from 'react-router-dom';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';

// Importaciones de archivos propios
import { ContratoData, PersonaData, PlanillaData, PlanillaDetalleData, DatosMensuales } from './types';
import { useAuth, API_URL_CONTRATOS, API_URL_PLANILLA, API_URL_PLANILLA_DETALLE, API_URL_PERSONA } from './api';
import { procesarEstadisticasContratos, procesarEstadisticasPlanillas, obtenerUltimoMesConDatos, calcularTotalAnual, formatearMoneda } from './dataProcessing';
import { 
  formatPercentage, 
  prepararDatosContratos, 
  prepararDatosNomina, 
  prepararDatosAportesSeguridadSocial, 
  prepararDatosAportesParafiscales, 
  prepararDatosPrestacionesSociales, 
  prepararDatosPrestamoEmpresa 
} from './chartConfig';
import { Main, drawerWidth } from './styles';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement, LineElement, PointElement, ChartDataLabels, Filler);

const Dashboard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isSmallScreen);
  const { data: authData, loading: loadingAuth, error: errorAuth } = useAuth();
  const clienteId = authData.empresaId;
  
  // Estado para almacenar los datos
  const [contratos, setContratos] = useState<ContratoData[]>([]);
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [planillas, setPlanillas] = useState<PlanillaData[]>([]);
  const [planillaDetalles, setPlanillaDetalles] = useState<PlanillaDetalleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estadísticas procesadas
  const [estadisticasEmpleados, setEstadisticasEmpleados] = useState({
    hombres: 0,
    mujeres: 0,
    total: 0
  });
  
  const [estadisticasContratos, setEstadisticasContratos] = useState<{[key: string]: number}>({});
  const [datosMensuales, setDatosMensuales] = useState<DatosMensuales>({});

  // Función para obtener datos
  useEffect(() => {
    const fetchData = async () => {
      if (!clienteId) return;
      
      try {
        setLoading(true);
        console.log("Solicitando datos para cliente_id:", clienteId);
        
        // Obtener personas
        const personasResponse = await axios.post(API_URL_PERSONA, {
          cliente_id: clienteId,
          action: 'leer'
        });
        
        if (personasResponse.data && Array.isArray(personasResponse.data)) {
          setPersonas(personasResponse.data);
        }
        
        // Obtener contratos
        const contratosResponse = await axios.post(API_URL_CONTRATOS, {
          cliente_id: clienteId,
          action: 'leer'
        });
        
        if (contratosResponse.data && Array.isArray(contratosResponse.data)) {
          setContratos(contratosResponse.data);
          const { estadisticasEmpleados, estadisticasContratos } = procesarEstadisticasContratos(
            contratosResponse.data, 
            personasResponse.data
          );
          setEstadisticasEmpleados(estadisticasEmpleados);
          setEstadisticasContratos(estadisticasContratos);
        }
        
        // Obtener planillas
        const planillasResponse = await axios.post(API_URL_PLANILLA, {
          cliente_id: clienteId,
          action: 'leer'
        });
        
        if (planillasResponse.data && Array.isArray(planillasResponse.data)) {
          setPlanillas(planillasResponse.data);
        }
        
        // Obtener detalles de planillas
        const planillaDetallesResponse = await axios.post(API_URL_PLANILLA_DETALLE, {
          cliente_id: clienteId,
          action: 'leer'
        });
        
        if (planillaDetallesResponse.data && Array.isArray(planillaDetallesResponse.data)) {
          setPlanillaDetalles(planillaDetallesResponse.data);
          const datosMensuales = procesarEstadisticasPlanillas(
            planillaDetallesResponse.data, 
            planillasResponse.data
          );
          setDatosMensuales(datosMensuales);
        }
        
      } catch (err: any) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      fetchData();
    }
  }, [clienteId]);

  const toggleDrawer = () => setOpen(!open);

  const handleLogout = (): void => {
    window.location.href = "http://localhost:3001/logout";
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Empresa', icon: <BusinessIcon />, path: '/empresa' },
    { text: 'Persona', icon: <PersonIcon />, path: '/persona' },
    { text: 'Sede', icon: <LocationCityIcon />, path: '/sede' },
    { text: 'Asignación Sede', icon: <LocationCityIcon />, path: '/asignacion-sede' },
    { text: 'Contrato', icon: <DescriptionIcon />, path: '/contrato' },
    { text: 'Planilla', icon: <AssignmentIcon />, path: '/planilla' },
  ];

  // Preparar datos para los gráficos
  const employeeData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        label: 'Empleados',
        data: [estadisticasEmpleados.hombres, estadisticasEmpleados.mujeres],
        backgroundColor: ['#1976d2', '#e91e63'],
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const contractData = prepararDatosContratos(estadisticasContratos);
  const payrollData = prepararDatosNomina(datosMensuales);
  const securitySocialData = prepararDatosAportesSeguridadSocial(datosMensuales);
  const parafiscalData = prepararDatosAportesParafiscales(datosMensuales);
  const socialBenefitsData = prepararDatosPrestacionesSociales(datosMensuales);
  const companyLoansData = prepararDatosPrestamoEmpresa(datosMensuales);

  const ultimoMes = obtenerUltimoMesConDatos(datosMensuales);

  // Renderizado condicional durante la carga
  if (loadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Cargando información...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e3f2fd', padding: 0, margin: 0 }}>
      <AppBar position="fixed" sx={{ backgroundColor: '#1976d2', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={toggleDrawer} sx={{ mr: 2 }} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6">OkCloud - Nómina Electrónica</Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant={isSmallScreen ? "temporary" : "permanent"} open={open} onClose={toggleDrawer} sx={{
        width: open ? drawerWidth : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 60,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          transition: 'width 0.3s',
          margin: 0,
          padding: 0,
        },
      }}>
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              component={Link as any}
              to={item.path}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
              onClick={() => isSmallScreen && setOpen(false)}
            >
              <Tooltip title={!open ? item.text : ''} placement="right" arrow>
                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              </Tooltip>
              {open && <ListItemText primary={item.text} sx={{ color: 'white' }} />}
            </ListItem>
          ))}
        </List>
        <Divider />
        <ListItem
          component="div"
          onClick={handleLogout}
          sx={{
            cursor: 'pointer',
            color: 'white',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
            border: 'none',
            marginTop: 2,
            display: 'flex',
          }}
          aria-label="Cerrar sesión"
        >
          <ListItemIcon sx={{ color: 'white', fontSize: 28 }}><LogoutIcon /></ListItemIcon>
          {open && <ListItemText primary="Cerrar Sesión" />}
        </ListItem>
      </Drawer>

      <Main open={open}>
        <Grid container spacing={3}>
          {/* Gráfico de Empleados */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Distribución de Empleados
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Pie data={employeeData} options={{
                      plugins: {
                        datalabels: {
                          color: '#ffffff',
                          font: { weight: 'bold' },
                          formatter: (value: number, context: any) => formatPercentage(value, context),
                        },
                      },
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Hombres:</Typography>
                        <Typography variant="body1">{estadisticasEmpleados.hombres}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Mujeres:</Typography>
                        <Typography variant="body1">{estadisticasEmpleados.mujeres}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{estadisticasEmpleados.total}</Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Contratos */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Proporción de Contratos
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Pie data={contractData} options={{
                      plugins: {
                        datalabels: {
                          color: '#ffffff',
                          font: { weight: 'bold' },
                          formatter: (value: number, context: any) => formatPercentage(value, context),
                        },
                      },
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      {Object.entries(estadisticasContratos).map(([tipo, cantidad]) => (
                        <Box key={tipo} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1">{tipo}:</Typography>
                          <Typography variant="body1">{cantidad}</Typography>
                        </Box>
                      ))}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {Object.values(estadisticasContratos).reduce((acc, val) => acc + val, 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Nómina */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Acumulado Mensual de Nómina
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Line data={payrollData} options={{
                      plugins: {
                        datalabels: {
                          display: false,
                        },
                      },
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Acumulado en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].totalNomina : 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Anual:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatearMoneda(calcularTotalAnual(datosMensuales))}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Aportes de Seguridad Social */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Aportes de Seguridad Social
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Bar data={securitySocialData} options={{
                      plugins: {
                        datalabels: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          stacked: false,
                        },
                        y: {
                          stacked: false,
                        }
                      }
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Aporte Empleado en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? 
                            datosMensuales[ultimoMes].pensionEmpleado + datosMensuales[ultimoMes].saludEmpleado : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Aporte Empleador en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? 
                            datosMensuales[ultimoMes].pensionEmpleador + datosMensuales[ultimoMes].saludEmpleador : 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Seguridad Social:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatearMoneda(ultimoMes !== 'N/A' ? 
                            datosMensuales[ultimoMes].pensionEmpleado + 
                            datosMensuales[ultimoMes].saludEmpleado + 
                            datosMensuales[ultimoMes].pensionEmpleador + 
                            datosMensuales[ultimoMes].saludEmpleador : 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Aportes Parafiscales */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Aportes Parafiscales
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Bar data={parafiscalData} options={{
                      plugins: {
                        datalabels: {
                          display: false,
                        },
                      }
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">SENA en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].senaEmpleador : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">ICBF en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].icbf : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Caja Compensación en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].cajaCompensacion : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Riesgos Laborales en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].riesgosLaborales : 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Parafiscales:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatearMoneda(ultimoMes !== 'N/A' ? 
                            datosMensuales[ultimoMes].senaEmpleador + 
                            datosMensuales[ultimoMes].icbf + 
                            datosMensuales[ultimoMes].cajaCompensacion + 
                            datosMensuales[ultimoMes].riesgosLaborales : 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Provisiones Laborales */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                  Provisiones Laborales
                </Typography>
                {loading ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                    Cargando datos...
                  </Typography>
                ) : (
                  <>
                    <Bar data={socialBenefitsData} options={{
                      plugins: {
                        datalabels: {
                          display: false,
                        },
                      },
                    }} />
                    <Box sx={{ marginTop: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Cesantías en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].cesantias : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Prima de Servicios en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].primaServicios : 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Vacaciones en {ultimoMes}:</Typography>
                        <Typography variant="body1">
                          {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].vacaciones : 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Provisiones:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatearMoneda(ultimoMes !== 'N/A' ? 
                            datosMensuales[ultimoMes].cesantias + 
                            datosMensuales[ultimoMes].primaServicios + 
                            datosMensuales[ultimoMes].vacaciones : 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Préstamos Empresa */}
          {Object.values(datosMensuales).some(datos => datos.prestamoEmpresa > 0) && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                    Préstamos Empresa
                  </Typography>
                  {loading ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', padding: 4 }}>
                      Cargando datos...
                    </Typography>
                  ) : (
                    <>
                      <Bar data={companyLoansData} options={{
                        plugins: {
                          datalabels: {
                            display: false,
                          },
                        },
                      }} />
                      <Box sx={{ marginTop: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1">Préstamos en {ultimoMes}:</Typography>
                          <Typography variant="body1">
                            {formatearMoneda(ultimoMes !== 'N/A' ? datosMensuales[ultimoMes].prestamoEmpresa : 0)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Anual Préstamos:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {formatearMoneda(Object.values(datosMensuales).reduce((acc, val) => acc + val.prestamoEmpresa, 0))}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Main>
    </Box>
  );
};

export default Dashboard;