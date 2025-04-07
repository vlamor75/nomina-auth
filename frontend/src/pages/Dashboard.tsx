import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider, Tooltip, useMediaQuery, Card, CardContent } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Home as HomeIcon, Business as BusinessIcon, Person as PersonIcon, LocationCity as LocationCityIcon, Assignment as AssignmentIcon, MonetizationOn as MonetizationOnIcon, Description as DescriptionIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement, LineElement, PointElement, Filler } from 'chart.js'; // Se agrega Filler
import { Link } from 'react-router-dom';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement, LineElement, PointElement, ChartDataLabels, Filler); // Registrar Filler

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: 15,
  transition: theme.transitions.create('padding', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  borderRadius: '20px',
  backgroundColor: 'white',
  maxWidth: '100%',
  marginTop: '84px',
  overflow: 'hidden',
}));

const Dashboard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isSmallScreen);

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

  // Datos para los gráficos
  const employeeData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        label: 'Empleados',
        data: [120, 80],
        backgroundColor: ['#1976d2', '#e91e63'],
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const contractData = {
    labels: ['Término Fijo', 'Indefinidos'],
    datasets: [
      {
        label: 'Contratos',
        data: [50, 150],
        backgroundColor: ['#ff9800', '#4caf50'],
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const payrollData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Acumulado Mensual',
        data: [8000, 9000, 10000, 11000, 12000, 13000],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const contributionsData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Empleado',
        data: [2000, 2200, 2400, 2600, 2800, 3000],
        backgroundColor: '#1976d2',
        barThickness: 20,
      },
      {
        label: 'Empleador',
        data: [3000, 3200, 3400, 3600, 3800, 4000],
        backgroundColor: '#4caf50',
        barThickness: 20,
      },
    ],
  };

  // Función de formateo tipada para evitar errores
  const formatPercentage = (value: number, context: any): string => {
    const data = Array.isArray(context.dataset.data)
      ? context.dataset.data.filter((val: any): val is number => typeof val === 'number')
      : [];
    const total = data.reduce((acc: number, val: number) => acc + val, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return `${percentage}% (${value})`;
  };

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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {/* Gráfico de Empleados */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Distribución de Empleados
              </Typography>
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
                  <Typography variant="body1">120</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Mujeres:</Typography>
                  <Typography variant="body1">80</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>200</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gráfico de Contratos */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Proporción de Contratos
              </Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Término Fijo:</Typography>
                  <Typography variant="body1">50</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Indefinidos:</Typography>
                  <Typography variant="body1">150</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>200</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gráfico de Nómina */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Acumulado Mensual de Nómina
              </Typography>
              <Line data={payrollData} options={{
                plugins: {
                  datalabels: {
                    display: false,
                  },
                },
              }} />
              <Box sx={{ marginTop: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Acumulado en Junio:</Typography>
                  <Typography variant="body1">$13,000</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total Anual:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>$72,000</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gráfico de Aportes Parafiscales */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Aportes Parafiscales
              </Typography>
              <Bar data={contributionsData} options={{
                plugins: {
                  datalabels: {
                    display: false,
                  },
                },
              }} />
              <Box sx={{ marginTop: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Aporte Empleado en Junio:</Typography>
                  <Typography variant="body1">$3,000</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Aporte Empleador en Junio:</Typography>
                  <Typography variant="body1">$4,000</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total en Junio:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>$7,000</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Main>
    </Box>
  );
};

export default Dashboard;