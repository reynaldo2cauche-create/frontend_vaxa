'use client'

import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import Image from 'next/image'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Image
              src="/images/imagotipo vaxa.png"
              alt="Vaxa Logo"
              width={100}
              height={75}
              style={{ objectFit: 'contain' }}
            />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
            <Button color="inherit" href="/#features">Características</Button>
            <Button color="inherit" href="/#seguridad">Seguridad</Button>
            <Button color="inherit" href="/#precios">Precios</Button>
            <Button variant="outlined" href="/#contacto">Solicitar información</Button>
          </Box>

          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Menú móvil */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <List>
            <ListItem button component="a" href="#features">
              <ListItemText primary="Características" />
            </ListItem>
            <ListItem button component="a" href="#seguridad">
              <ListItemText primary="Seguridad" />
            </ListItem>
            <ListItem button component="a" href="#precios">
              <ListItemText primary="Precios" />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem button component="a" href="#contacto">
              <ListItemText primary="Solicitar información" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  )
}
