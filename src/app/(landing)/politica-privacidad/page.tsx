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
  Divider,
  Paper
} from '@mui/material'
import {
  Menu as MenuIcon,
  ArrowBack,
  Email
} from '@mui/icons-material'
import Image from 'next/image'

export default function PoliticaPrivacidad() {
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
            Política de Privacidad
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
              1. Identidad del Responsable del Tratamiento de Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C., con RUC N.º [pendiente], con domicilio en [pendiente], es responsable del tratamiento de los datos personales recopilados a través de sus plataformas digitales, incluyendo su sitio web, aplicaciones web y sistemas en línea.
            </Typography>
          </Box>

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              2. Finalidad del Tratamiento de Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos personales que recopilamos se utilizan con las siguientes finalidades:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Gestionar el acceso y uso de los servicios digitales ofrecidos por VAXA SYSTEMS S.A.C.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Brindar soporte técnico y atención al cliente.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Enviar notificaciones, actualizaciones o información relacionada con nuestros servicios.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Cumplir con obligaciones legales y contractuales.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Realizar análisis estadísticos para mejorar nuestros productos y servicios.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              3. Datos que Recopilamos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Podemos recopilar los siguientes datos personales:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Datos de identificación (nombre, DNI, RUC, cargo, empresa, etc.).
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Datos de contacto (correo electrónico, número telefónico, dirección).
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Datos de acceso y uso del sistema (usuario, IP, fecha, hora de ingreso).
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Información clínica o sensible únicamente cuando sea ingresada voluntariamente por los usuarios autorizados dentro del sistema de historias clínicas electrónicas, de acuerdo con la Ley N.º 29733 – Ley de Protección de Datos Personales y su reglamento (D.S. N.º 003-2013-JUS).
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              4. Confidencialidad y Seguridad de la Información
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. aplica medidas técnicas y organizativas adecuadas para proteger los datos personales contra el acceso no autorizado, pérdida o alteración. Toda la información se almacena en servidores seguros con acceso restringido y sistemas de respaldo periódicos.
            </Typography>
          </Box>

          {/* Section 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              5. Cesión y Transferencia de Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos personales no serán compartidos ni transferidos a terceros, salvo:
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Con autorización expresa del titular.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Por requerimiento de autoridad competente.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1" paragraph>
                  Para el cumplimiento de obligaciones legales o contractuales.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              6. Derechos del Titular de los Datos (ARCO)
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              El usuario puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) enviando una solicitud al correo:
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email sx={{ color: '#059669' }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                datos@vaxa.com.pe
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              Adjuntando su nombre completo, documento de identidad y el detalle de su solicitud.
            </Typography>
          </Box>

          {/* Section 7 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              7. Conservación de los Datos
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Los datos se conservarán durante el tiempo necesario para cumplir con las finalidades descritas o mientras el usuario mantenga una relación contractual activa con VAXA SYSTEMS S.A.C.
            </Typography>
          </Box>

          {/* Section 8 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              8. Modificaciones a la Política de Privacidad
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              VAXA SYSTEMS S.A.C. se reserva el derecho de modificar esta política en cualquier momento. Las actualizaciones se publicarán en www.vaxa.com.pe, con indicación de la fecha de la última revisión.
            </Typography>
          </Box>

          {/* Section 9 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#059669' }}>
              9. Consentimiento del Usuario
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Al utilizar nuestros servicios digitales o registrarse en nuestras plataformas, el usuario declara haber leído, comprendido y aceptado los términos de esta Política de Privacidad.
            </Typography>
          </Box>

          {/* Contact CTA */}
          <Box sx={{ mt: 6, p: 3, bgcolor: '#ecfdf5', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#065f46' }}>
              ¿Tienes dudas sobre nuestra política de privacidad?
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/"
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