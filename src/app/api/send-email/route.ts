import { NextResponse } from "next/server";
import * as nodemailer from "nodemailer";

interface ContactFormData {
  nombre: string;
  email: string;
  celular?: string;
  centro?: string;
  tamano?: string;
  mensaje?: string;
  acepta: boolean;
}
// Forzar renderizado dinámico para esta API route
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const formData: ContactFormData = await req.json();
    
    // Validaciones básicas
    if (!formData.nombre || !formData.email || !formData.acepta) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Variables de entorno faltantes:", {
        EMAIL_HOST: !!process.env.EMAIL_HOST,
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS
      });
      return NextResponse.json(
        { success: false, message: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Configuración del transportador con múltiples opciones
    const port = Number(process.env.EMAIL_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: port === 465, // true solo para puerto 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Configuraciones adicionales para hostings compartidos
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 60000, // 60 segundos
      greetingTimeout: 30000,   // 30 segundos
      socketTimeout: 60000      // 60 segundos
    });

    // Verificar conexión SMTP
    await transporter.verify();
    console.log("✅ Conexión SMTP verificada");

    // Contenido del correo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuevo contacto - Vaxa</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
            📩 Nuevo mensaje desde el formulario web
          </h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Nombre:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.nombre}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                  <a href="mailto:${formData.email}">${formData.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Celular:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                  ${formData.celular ? `<a href="https://wa.me/${formData.celular.replace(/[^0-9]/g, '')}">${formData.celular}</a>` : "No proporcionado"}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Centro:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.centro || "No especificado"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tamaño:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.tamano || "No especificado"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Acepta políticas:</strong></td>
                <td style="padding: 8px 0;">${formData.acepta ? "✅ Sí" : "❌ No"}</td>
              </tr>
            </table>
          </div>

          ${formData.mensaje ? `
          <div style="margin: 20px 0;">
            <strong>Mensaje:</strong>
            <div style="background: #fff; padding: 15px; border-left: 4px solid #059669; margin-top: 10px;">
              ${formData.mensaje.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; font-size: 12px; color: #666;">
            📅 Enviado el: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar correo
    const info = await transporter.sendMail({
      from: `"Formulario Vaxa" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `🔔 Nuevo contacto: ${formData.nombre}`,
      html: htmlContent,
      replyTo: formData.email // Para poder responder directamente
    });

    console.log("✅ Correo enviado:", info.messageId);

    return NextResponse.json(
      { success: true, message: "¡Gracias! Hemos recibido tu solicitud." },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("❌ Error detallado:", {
      message: error.message,
      code: error.code,
      response: error.response
    });

    // Manejar errores específicos
    let errorMessage = "Error interno del servidor";
    
    if (error.code === 'EAUTH') {
      errorMessage = "Error de autenticación SMTP. Verifica credenciales.";
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "No se pudo conectar al servidor de correo.";
    } else if (error.code === 'ECONNECTION') {
      errorMessage = "Error de conexión con el servidor SMTP.";
    }

    return NextResponse.json(
      { success: false, message: "Ocurrió un error al enviar. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}