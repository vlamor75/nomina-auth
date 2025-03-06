import React from 'react';
import { Box, Typography } from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';


const Planilla = () => {
  return (
    <DashboardLayout>
      <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 2, maxWidth: '1000px', margin: '20px auto' }}>
        <Typography variant="h4" sx={{ marginBottom: 2, textAlign: 'left' }}>
        Persona
        </Typography>
        <Typography variant="body1">
          Aquí irá el contenido de la página Planilla.
        </Typography>
      </Box>
    </DashboardLayout>
  );
};

export default Planilla;
