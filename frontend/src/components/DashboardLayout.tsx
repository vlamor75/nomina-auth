import React, { ReactNode, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Home as HomeIcon, Business as BusinessIcon, Person as PersonIcon, LocationCity as LocationCityIcon, Assignment as AssignmentIcon, MonetizationOn as MonetizationOnIcon, Description as DescriptionIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{ open: boolean }>(({ theme, open }) => ({
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

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isSmallScreen);

  const toggleDrawer = () => setOpen(!open);

  const handleLogout = () => {
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
              component={Link}
              to={item.path}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
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
          component="button"
          onClick={handleLogout}
          sx={{ cursor: 'pointer', color: 'white', backgroundColor: 'transparent', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
          aria-label="Cerrar sesión"
        >
          <ListItemIcon sx={{ color: 'white', fontSize: 28 }}><LogoutIcon /></ListItemIcon>
          {open && <ListItemText primary="Cerrar Sesión" />}
        </ListItem>
      </Drawer>

      <Main open={open}>
        {children}
      </Main>
    </Box>
  );
};

export default DashboardLayout;
