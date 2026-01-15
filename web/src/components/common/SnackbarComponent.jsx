import React from 'react';
import { Snackbar, Alert, Fade } from '@mui/material';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

function FadeTransition(props) {
  return <Fade {...props} timeout={{ enter: 300, exit: 600 }} />;
}

const Toast = ({ open, handleClose, message, severity = "success" }) => {
  const iconMapping = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={FadeTransition}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        icon={iconMapping[severity]}
        sx={{
          width: '100%',
          borderRadius: '12px',
          fontWeight: 600,
          backgroundColor: severity === 'success' ? '#00A86B' : undefined,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
