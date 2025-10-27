'use client'
import Link from 'next/link'
import { Box, Container, Grid, Typography, Button } from '@mui/material'
import Image from 'next/image'

export default function Footer() {
  return (
    <Box sx={{ borderTop: '1px solid #e5e7eb', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
              <Image
                src="/images/imagotipo vaxa.png"
                alt="Vaxa Logo"
                width={120}
                height={60}
                style={{ objectFit: 'contain' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                © {new Date().getFullYear()} Vaxa. Todos los derechos reservados.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Button
                component={Link}
                href="/politica-privacidad"
                variant="text"
                size="small"
                color="inherit"
              >
                Política de Privacidad
              </Button>
              <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
              <Button
                component={Link}
                href="/terminos-condiciones"
                variant="text"
                size="small"
                color="inherit"
              >
                Términos y Condiciones
              </Button>
              <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
              <Button
                component={Link}
                href="/#contacto"
                variant="text"
                size="small"
                color="inherit"
              >
                Contacto
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
