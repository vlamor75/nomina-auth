// /pages/Dashboard/styles.ts
import { styled } from '@mui/material/styles';

export const drawerWidth = 240;

export const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
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