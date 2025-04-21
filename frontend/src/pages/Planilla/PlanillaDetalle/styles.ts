// frontend\src\pages\Planilla\PlanillaDetalle\styles.ts
export const containerStyles = {
    p: 2,
    bgcolor: '#f8f8f8',
  };
  
  export const cardStyles = {
    minHeight: 180,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    boxShadow: 3,
    border: '1px solid #e0e0e0',
    borderRadius: 2,
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  };
  
  export const gradientHeader = {
    background: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
    color: 'white',
    p: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  };