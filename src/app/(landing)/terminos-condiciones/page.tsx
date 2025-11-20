'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material'
import {
  Menu as MenuIcon,
  ArrowBack,
  Email,
  Language,
  LocationOn
} from '@mui/icons-material'
import Image from 'next/image'

export default function TerminosCondiciones() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box>
      
      {/* Hero Section */}
      <Box sx={{ py: 6, background: 'linear-gradient(#fff, #f9fafb)', borderBottom: '1px solid #e5e7eb' }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            href="/"
            sx={{ mb: 3, color: '#059669' }}
          >
            Volver al inicio
          </Button>
          <Typography variant="h2" sx={{ fontSize: { xs: 32, md: 42 }, lineHeight: 1.2, mb: 2 }}>
            Términos y Condiciones de Uso
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
            VAXA SYSTEMS S.A.C.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Última actualización: Enero de 2025
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #e5e7eb' }}>
          
          {/* Section 1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              1. Aceptación de los Términos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El acceso y uso de los servicios ofrecidos por VAXA SYSTEMS S.A.C. implica la aceptación plena de los presentes Términos y Condiciones. Si el usuario no está de acuerdo, deberá abstenerse de utilizar los servicios.
            </Typography>
          </Box>

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              2. Descripción del Servicio
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. ofrece soluciones digitales para centros terapéuticos y profesionales de la salud, incluyendo:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Sistema en línea de Historias Clínicas Electrónicas, agenda y reportes.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Desarrollo web y servicios tecnológicos personalizados.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Soporte técnico y mantenimiento digital.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              3. Condiciones de Uso
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  El usuario se compromete a utilizar el sistema de forma ética, segura y conforme a las leyes vigentes.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Está prohibido el uso del sistema para fines ilícitos, manipulación de datos, acceso no autorizado o vulneración de derechos de terceros.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Cada usuario es responsable de la confidencialidad de sus credenciales de acceso.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              4. Propiedad Intelectual
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Todo el contenido, código, diseño, logotipos y documentación del sistema pertenecen a VAXA SYSTEMS S.A.C.. Queda prohibida su reproducción, distribución o uso no autorizado.
            </Typography>
          </Box>

          {/* Section 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              5. Responsabilidad del Usuario
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El usuario es responsable de la veracidad de la información ingresada y de las acciones realizadas dentro del sistema con su cuenta personal. VAXA SYSTEMS S.A.C. no se hace responsable por el mal uso, pérdida o divulgación indebida de información por parte del usuario.
            </Typography>
          </Box>

          {/* Section 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              6. Limitación de Responsabilidad
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. no garantiza la disponibilidad ininterrumpida del servicio en caso de fallas técnicas, mantenimiento o causas de fuerza mayor. Tampoco se responsabiliza por daños indirectos derivados del uso del sistema.
            </Typography>
          </Box>

          {/* Section 7 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              7. Modificaciones del Servicio
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. se reserva el derecho de actualizar, suspender o modificar el sistema, sus funcionalidades o precios, notificando oportunamente a los usuarios.
            </Typography>
          </Box>

          {/* Section 8 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              8. Política de Pagos y Renovaciones
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Los servicios contratados se pagan según los planes establecidos y vigentes en el momento de la suscripción.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Las renovaciones son automáticas salvo notificación previa de cancelación.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Los montos abonados no son reembolsables una vez iniciado el servicio.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 9 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              9. Legislación Aplicable y Jurisdicción
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Estos Términos y Condiciones se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta por los tribunales competentes de la ciudad de Lima Metropolitana.
            </Typography>
          </Box>

          {/* Section 10 - Contacto */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              10. Contacto
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Email sx={{ color: '#059669' }} />
                <Typography variant="body1">
                  <strong>Email:</strong> contacto@vaxa.com.pe
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Language sx={{ color: '#059669' }} />
                <Typography variant="body1">
                  <strong>Web:</strong> www.vaxa.com.pe
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#059669' }} />
                <Typography variant="body1">
                  <strong>Ubicación:</strong> Lima – Perú
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Lema Corporativo */}
          <Box sx={{ mt: 6, p: 4, bgcolor: '#ecfdf5', borderRadius: 2, textAlign: 'center', border: '2px solid #059669' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#065f46', fontStyle: 'italic' }}>
              &ldquo; Digitalizamos tu gestión, potenciamos tu atención. &ldquo;
            </Typography>
          </Box>

          {/* Contact CTA */}
          <Box sx={{ mt: 6, p: 3, bgcolor: '#f9fafb', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#374151' }}>
              ¿Tienes dudas sobre nuestros términos y condiciones?
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/#contacto"
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Contáctanos
            </Button>
          </Box>
        </Paper>
      </Container>

    
    </Box>
  )
}