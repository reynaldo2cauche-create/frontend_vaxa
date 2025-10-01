'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormHelperText
} from '@mui/material'
import {
  Security,
  Edit,
  CalendarToday,
  FolderOpen,
  TrendingUp,
  Extension,
  Menu as MenuIcon,
  ExpandMore,
  WhatsApp,
  Shield,
  CloudSync,
  Lock
} from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'
import emailjs from '@emailjs/browser'
import { format } from 'path'

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    celular: '',
    centro: '',
    tamano: '',
    mensaje: 'Estoy interesado en Vaxa y deseo más información.',
    acepta: false
  })
  const [formStatus, setFormStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  const handleInputChange = (e: any) => {
    const { name, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'acepta' ? checked : value
    }))
  }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
    return; // si hay errores, no envía
  }
    setLoading(true);
    setFormStatus({ type: '', message: '' });

    try {
      // Configuración de EmailJS con tu correo de hosting
      const serviceId = 'service_86mzzho';      // Service conectado a tu SMTP
      const templateId = 'template_g3xnt9n';    // Template creado
      const publicKey = 'yZ3hxwjnd6qbT5XBf';      // Public key de tu cuenta

      // Parámetros que se enviarán al template de EmailJS
      const templateParams = {
        from_name: formData.nombre,
        from_email: formData.email,
        celular: formData.celular || 'No proporcionado',
        centro: formData.centro || 'No proporcionado',
        tamano: formData.tamano || 'No seleccionado',
        message: formData.mensaje || 'Sin mensaje adicional',
        reply_to: formData.email,
      };

      // Enviar email directamente desde el cliente
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      console.log('Email enviado:', response);

      setFormStatus({
        type: 'success',
        message: '¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas.'
      });

      // Limpiar formulario
      setFormData({
        nombre: '',
        email: '',
        celular: '',
        centro: '',
        tamano: '',
        mensaje: '',
        acepta: false
      });

    } catch (error) {
      console.error('Error al enviar:', error);
      setFormStatus({
        type: 'error',
        message: 'Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  const validateForm=()=>{
    let tempErrors: { [key: string]: string } = {};
    if (!formData.nombre.trim()) {
    tempErrors.nombre = "El nombre es obligatorio.";
    }
    if (!formData.email.trim()) {
    tempErrors.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = "El correo no es válido.";
    }
    if (!formData.celular.trim()) {
    tempErrors.celular = "El número de teléfono es obligatorio.";
    } else if (!/^\d{9}$/.test(formData.celular)) {
      tempErrors.celular = "El número de teléfono debe tener 9 dígitos.";
    }
    if(!formData.centro.trim()){
      tempErrors.centro = "El nombre del centro es obligatorio.";
    }
    if(!formData.tamano.trim()){
      tempErrors.tamano = "El tamaño del centro es obligatorio.";
    }
    if(!formData.mensaje.trim()){
      tempErrors.mensaje = "El mensaje es obligatorio.";
    }
    if (!formData.acepta) {
      tempErrors.acepta = "Debes aceptar la Política de Privacidad.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0; // true si no hay errores

  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Seguridad y cumplimiento',
      description: 'Roles y permisos, auditoría, respaldos automáticos y estándares de protección de datos.'
    },
    {
      icon: <Edit sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Firmas y validación QR',
      description: 'Firmas digitales y verificación por código QR en informes y certificados.'
    },
    {
      icon: <CalendarToday sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Agenda y asistencia',
      description: 'Calendario por terapeuta, recordatorios y control de inasistencias.'
    },
    {
      icon: <FolderOpen sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Historias clínicas flexibles',
      description: 'Plantillas para psicología, lenguaje y ocupacional; notas SOAP y adjuntos.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Reportes y métricas',
      description: 'Indicadores de progreso, productividad y facturación en un clic.'
    },
    {
      icon: <Extension sx={{ fontSize: 40, color: '#059669' }} />,
      title: 'Integraciones',
      description: 'WhatsApp, correo, pagos y exportaciones a PDF/Excel.'
    }
  ]

  const faqs = [
    {
      question: '¿Necesito instalación?',
      answer: 'No. Vaxa es 100% web y funciona en cualquier navegador moderno.'
    },
    {
      question: '¿Puedo exportar mis datos?',
      answer: 'Sí. Puedes exportar historias, reportes y adjuntos cuando lo necesites.'
    },
    {
      question: '¿Ofrecen capacitación?',
      answer: 'Incluimos onboarding y material de soporte para tu equipo clínico y administrativo.'
    }
  ]

  return (
    <Box>
      {/* Header */}
      <AppBar position="sticky" sx={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
            <Button color="inherit" href="#features">Características</Button>
            <Button color="inherit" href="#seguridad">Seguridad</Button>
            <Button color="inherit" href="#precios">Precios</Button>
            <Button variant="outlined" href="#contacto">Solicitar información</Button>
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

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
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

      {/* Hero Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(#fff, #f9fafb)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="Software para centros terapéuticos"
                sx={{
                  bgcolor: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: 12,
                  border: '1px solid #a7f3d0',
                  mb: 2
                }}
              />
              <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 42 }, lineHeight: 1.1, mb: 1 }}>
                Historias clínicas{' '}
                <Box component="span" sx={{ color: '#059669' }}>
                  electrónicas
                </Box>{' '}
                para equipos que crecen
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '56ch' }}>
                Vaxa digitaliza el registro clínico, agenda, firmas y reportes para que tu equipo se enfoque en lo más importante: el paciente.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  href="#contacto"
                  sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                >
                  Solicitar demo
                </Button>
                <Button variant="outlined" size="large" href="#features">
                  Ver características
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">✅ Sin instalación</Typography>
                <Typography variant="body2" color="text.secondary">✅ Multiusuario</Typography>
                <Typography variant="body2" color="text.secondary">✅ Backups automáticos</Typography>
              </Box>
            </Grid>
            
            {/* Formulario */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)' }}>
                <Typography variant="h5" gutterBottom>
                  Solicita información
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Te respondemos en menos de 24 horas hábiles.
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre y apellido *"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Ej. Ana Pérez"
                        error={Boolean(errors.nombre)}
                        helperText={errors.nombre}
                      
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Correo electrónico *"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="nombre@empresa.com"
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                       
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Celular (WhatsApp)"
                        name="celular"
                        value={formData.celular}
                        onChange={handleInputChange}
                        placeholder="+51 9xx xxx xxx"
                        error={Boolean(errors.celular)}
                        helperText={errors.celular}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Centro terapéutico"
                        name="centro"
                        value={formData.centro}
                        onChange={handleInputChange}
                        placeholder="Nombre de tu institución"
                        error={Boolean(errors.centro)}
                        helperText={errors.centro}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Tamaño del centro</InputLabel>
                        <Select
                          name="tamano"
                          value={formData.tamano}
                          onChange={handleInputChange}
                          label="Tamaño del centro"
                        >
                          <MenuItem value="">Selecciona…</MenuItem>
                          <MenuItem value="1-3">1–3 terapeutas</MenuItem>
                          <MenuItem value="4-10">4–10 terapeutas</MenuItem>
                          <MenuItem value="10+">Más de 10 terapeutas</MenuItem>
                        </Select>
                        {errors.tamano && (
                          <FormHelperText>{errors.tamano}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Mensaje"
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleInputChange}
                        error={Boolean(errors.mensaje)}
                        helperText={errors.mensaje}
                      />
                    </Grid>
                  </Grid>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="acepta"
                        checked={formData.acepta}
                        onChange={handleInputChange}

                        
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Acepto la{' '}
                        <Button variant="text" size="small" href="#politica">
                          Política de Privacidad
                        </Button>{' '}
                        y los{' '}
                        <Button variant="text" size="small" href="#terminos">
                          Términos y Condiciones
                        </Button>
                        . *
                      </Typography>
                    }
                    sx={{ mt: 2, mb: 2 }}
                  />
                  
                  {formStatus.message && (
                    <Alert severity={formStatus.type as any} sx={{ mb: 2 }}>
                      {formStatus.message}
                    </Alert>
                  )}
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, mb: 2 }}
                  >
                    {loading ? 'Enviando…' : 'Enviar'}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Protegido con cifrado TLS. No compartimos tus datos con terceros.
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<WhatsApp />}
                    href="https://wa.me/51974280156?text=Hola%20Vaxa%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n"
                    target="_blank"
                    rel="noopener"
                  >
                    Escribir por WhatsApp
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            Todo lo que necesitas para tu flujo terapéutico
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            Optimiza evaluación, intervención y seguimiento con herramientas pensadas para equipos clínicos.
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%', p: 2, boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)' }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Security Section */}
      <Box id="seguridad" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" gutterBottom>
                Seguridad de nivel empresarial
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">✔ Cifrado en tránsito (TLS) y en reposo.</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">✔ Control de acceso por roles, doble factor (2FA) y bitácoras de auditoría.</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">✔ Copias de seguridad programadas y recuperación de versiones.</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">✔ Hosting en la nube con alta disponibilidad.</Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="large"
                href="#contacto"
                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, mt: 2 }}
              >
                Solicitar ficha técnica
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: '#0b1020',
                  color: '#d1d5db',
                  borderRadius: 2,
                  p: 2,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  boxShadow: '0 10px 20px rgba(2,6,23,.08), 0 2px 6px rgba(2,6,23,.06)'
                }}
              >
                <pre>{`# Ejemplo de pseudocódigo de cifrado
POST /api/historia-clinica
Headers: Authorization: Bearer <token>
Body (AES-256-GCM): {...}`}</pre>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing CTA */}
      <Box id="precios" sx={{ py: 8, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" gutterBottom>
            Planes simples y escalables
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Paga solo por los terapeutas activos. Descuentos por volumen.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              href="#contacto"
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Cotizar ahora
            </Button>
            <Button variant="outlined" size="large" href="#contacto">
              Hablar con ventas
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ py: 8, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="md">
          <Typography variant="h3" textAlign="center" gutterBottom>
            Preguntas frecuentes
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* Footer */}
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
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button variant="text" size="small" href="#politica" color="inherit">
                  Política de Privacidad
                </Button>
                <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
                <Button variant="text" size="small" href="#terminos" color="inherit">
                  Términos y Condiciones
                </Button>
                <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>·</Typography>
                <Button variant="text" size="small" href="#contacto" color="inherit">
                  Contacto
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
    )
}
