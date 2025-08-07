import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { LoginForm } from './components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
            Sign In to Evently
          </Typography>
          <LoginForm />
        </Box>
      </Container>
    </Box>
  );
};