import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

/**
 * Application header with Oracle branding.
 * @param {object} props
 * @param {string} props.title - Main application title
 * @param {string} [props.subtitle] - Optional subtitle shown below the title
 */
function Header({ title, subtitle }) {
  return (
    <AppBar position="static" sx={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' }}>
      <Toolbar>
        <Box component="img" src="/oracle_logo.png" alt="Oracle Logo" sx={{ height: 32, mr: 2 }} />
        <Box>
          <Typography variant="h6" component="h1" sx={{ color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
