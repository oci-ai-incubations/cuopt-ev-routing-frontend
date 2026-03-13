import React from 'react';
import Box from '@mui/material/Box';
import Header from './components/Header';

/**
 * Root application component.
 * Replace this placeholder with the actual app layout and features.
 */
function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header title="EV Routing" subtitle="OCI AI Accelerator" />
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        {/* Feature content goes here */}
      </Box>
    </Box>
  );
}

export default App;
