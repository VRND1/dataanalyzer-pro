import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface ErrorMessageProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  severity = 'error',
  onRetry 
}) => {
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Alert 
        severity={severity}
        action={
          onRetry && (
            <Box 
              component="button" 
              onClick={onRetry}
              sx={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              Retry
            </Box>
          )
        }
      >
        <AlertTitle>{severity.charAt(0).toUpperCase() + severity.slice(1)}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage; 