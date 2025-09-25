// app/api/test-email/route.ts
import { NextResponse } from "next/server";
import * as nodemailer from "nodemailer";

export async function GET() {
  try {
    console.log("🔍 Probando configuración SMTP...");
    
    // Verificar variables de entorno
    console.log("📋 Variables de entorno:", {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? "***OCULTA***" : "NO DEFINIDA",
      EMAIL_TO: process.env.EMAIL_TO
    });

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ 
        success: false, 
        error: "Variables de entorno faltantes",
        missing: {
          EMAIL_HOST: !process.env.EMAIL_HOST,
          EMAIL_USER: !process.env.EMAIL_USER, 
          EMAIL_PASS: !process.env.EMAIL_PASS
        }
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true, // Habilitar debug
      logger: true // Habilitar logs
    });

    console.log("🔧 Verificando conexión SMTP...");
    await transporter.verify();
    
    console.log("✅ SMTP verificado, enviando correo de prueba...");
    
    // Enviar correo de prueba
    const info = await transporter.sendMail({
      from: `"Test Vaxa" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: "🧪 Test de configuración SMTP",
      html: `
        <h2>Prueba exitosa</h2>
        <p>El SMTP está funcionando correctamente.</p>
        <p>Fecha: ${new Date().toLocaleString('es-PE')}</p>
      `
    });

    console.log("📧 Correo enviado:", info.messageId);
    
    return NextResponse.json({ 
      success: true, 
      message: "SMTP configurado y funcionando correctamente",
      messageId: info.messageId
    });
    
  } catch (error: any) {
    console.error("❌ Error detallado:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  }
}