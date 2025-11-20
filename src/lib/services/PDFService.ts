import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface DatosPDF {
  titulo: string;
  nombre: string;
  curso: string;
  fecha: string;
  horas?: string;
  cuerpo: string;
}

export interface LogoPDF {
  url: string;
  posicion: 1 | 2 | 3;
}

export interface FirmaPDF {
  nombre: string;
  cargo: string;
  firmaUrl: string;
}

export interface ParametrosPDF {
  plantillaFondo: string;
  logoEmpresa?: string;
  logos?: LogoPDF[];
  firmas?: FirmaPDF[];
  datos: DatosPDF;
  codigo: string;
  qrDataURL: string;
  outputPath: string;
}

export class PDFService {
  static async generarCertificadoPDF(params: ParametrosPDF): Promise<void> {
    const {
      plantillaFondo,
      logoEmpresa,
      logos,
      firmas,
      datos,
      codigo,
      qrDataURL,
      outputPath
    } = params;

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1122,
        height: 794
      });

      let cuerpoFinal = datos.cuerpo
        .replace(/\{nombre\}/gi, datos.nombre)
        .replace(/\{curso\}/gi, datos.curso)
        .replace(/\{fecha\}/gi, datos.fecha)
        .replace(/\{horas\}/gi, datos.horas || '')
        .replace(/\{documento\}/gi, '')
        .replace(/\{tipo_documento\}/gi, '');

      const MAX_CARACTERES = 300;
      const esTextoLargo = cuerpoFinal.length > 200;

      if (cuerpoFinal.length > MAX_CARACTERES) {
        cuerpoFinal = cuerpoFinal.substring(0, MAX_CARACTERES) + '...';
      }

      const claseTexto = esTextoLargo ? 'cuerpo texto-largo' : 'cuerpo';

      let fondoDataURL = plantillaFondo;
      let logoDataURL = logoEmpresa || '';

      console.log(`🖼️  Procesando imagen de fondo para PDF:`);
      console.log(`   - Ruta recibida: ${plantillaFondo}`);

      if (plantillaFondo && !plantillaFondo.startsWith('http') && !plantillaFondo.startsWith('data:')) {
        const fondoPath = path.join(process.cwd(), 'public', plantillaFondo);
        console.log(`   - Ruta absoluta construida: ${fondoPath}`);

        if (fs.existsSync(fondoPath)) {
          const fondoBuffer = fs.readFileSync(fondoPath);
          const fondoExt = path.extname(fondoPath).substring(1);
          fondoDataURL = `data:image/${fondoExt};base64,${fondoBuffer.toString('base64')}`;
          console.log(`   ✅ Imagen convertida a base64 (${fondoBuffer.length} bytes)`);
        } else {
          console.error(`   ❌ ERROR: Archivo de fondo no encontrado en: ${fondoPath}`);
        }
      }

      if (logoEmpresa && !logoEmpresa.startsWith('http') && !logoEmpresa.startsWith('data:')) {
        const logoPath = path.join(process.cwd(), 'public', logoEmpresa);
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const logoExt = path.extname(logoPath).substring(1);
          logoDataURL = `data:image/${logoExt};base64,${logoBuffer.toString('base64')}`;
        }
      }

      const logosDataURL: { url: string; posicion: 1 | 2 | 3 }[] = [];
      if (logos && logos.length > 0) {
        for (const logo of logos) {
          if (logo.url && !logo.url.startsWith('http') && !logo.url.startsWith('data:')) {
            const logoPath = path.join(process.cwd(), 'public', logo.url);
            if (fs.existsSync(logoPath)) {
              const logoBuffer = fs.readFileSync(logoPath);
              const logoExt = path.extname(logoPath).substring(1);
              const logoBase64 = `data:image/${logoExt};base64,${logoBuffer.toString('base64')}`;
              logosDataURL.push({ url: logoBase64, posicion: logo.posicion });
              console.log(`   ✅ Logo posición ${logo.posicion} convertido a base64`);
            }
          }
        }
      }

      const firmasDataURL: { nombre: string; cargo: string; url: string }[] = [];
      if (firmas && firmas.length > 0) {
        for (const firma of firmas) {
          if (firma.firmaUrl && !firma.firmaUrl.startsWith('http') && !firma.firmaUrl.startsWith('data:')) {
            const firmaPath = path.join(process.cwd(), 'public', firma.firmaUrl);
            if (fs.existsSync(firmaPath)) {
              const firmaBuffer = fs.readFileSync(firmaPath);
              const firmaExt = path.extname(firmaPath).substring(1);
              const firmaBase64 = `data:image/${firmaExt};base64,${firmaBuffer.toString('base64')}`;
              firmasDataURL.push({
                nombre: firma.nombre,
                cargo: firma.cargo,
                url: firmaBase64
              });
              console.log(`   ✅ Firma de ${firma.nombre} convertida a base64`);
            } else {
              console.warn(`   ⚠️ Firma no encontrada: ${firmaPath}`);
            }
          }
        }
      }

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 297mm;
      height: 210mm;
      position: relative;
      font-family: 'Arial', 'Helvetica', sans-serif;
      overflow: hidden;
    }

    .fondo {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }

    .contenido {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      padding: 35px 80px 30px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .logo-izquierda {
      position: absolute;
      top: 20px;
      left: 60px;
      width: 180px;
      height: 120px;
      object-fit: contain;
    }

    .logo-derecha {
      position: absolute;
      top: 20px;
      right: 60px;
      width: 180px;
      height: 120px;
      object-fit: contain;
    }

    .logo-centro {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 180px;
      height: 120px;
      object-fit: contain;
    }

    .centro {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 100px 0 100px;
      margin-top: -10px;
    }

    .titulo {
      font-size: 32px;
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .nombre {
      font-size: 42px;
      font-weight: bold;
      color: #0f172a;
      margin: 15px 0 20px 0;
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.2;
      max-width: 900px;
    }

    .cuerpo {
      font-size: 20px;
      color: #475569;
      line-height: 1.6;
      max-width: 880px;
      margin: 15px 0 20px 0;
    }

    .cuerpo.texto-largo {
      font-size: 18px;
      line-height: 1.5;
    }

    .curso {
      font-size: 22px;
      font-style: italic;
      color: #1e40af;
      margin: 15px 0 0 0;
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.3;
      max-width: 800px;
    }

    .pie {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 50px;
      margin-bottom: 10px;
    }

    .datos {
      font-size: 16px;
      color: #64748b;
      line-height: 1.4;
    }

    .qr-container {
      position: absolute;
      bottom: 40px;
      right: 70px;
      text-align: center;
    }

    .qr {
      width: 100px;
      height: 100px;
      margin-bottom: 6px;
    }

    .codigo {
      font-size: 9px;
      color: #94a3b8;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      max-width: 110px;
    }

    .footer-text {
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }

    .firmas-container {
      position: absolute;
      bottom: 75px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
      gap: 80px;
      width: 80%;
      max-width: 650px;
    }

    .firma-item {
      text-align: center;
      flex: 1;
      max-width: 180px;
    }

    .firma-imagen {
      width: 160px;
      height: 60px;
      object-fit: contain;
      object-position: center bottom;
      margin-bottom: -12px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .firma-linea {
      border-top: 1.5px solid #475569;
      width: 100%;
      margin-bottom: 3px;
    }

    .firma-nombre {
      font-size: 11px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .firma-cargo {
      font-size: 9px;
      color: #64748b;
      font-style: italic;
    }
  </style>
</head>
<body>
  ${fondoDataURL ? `<img src="${fondoDataURL}" class="fondo" alt="Fondo">` : ''}

  <div class="contenido">
    ${logoDataURL ? `<img src="${logoDataURL}" class="logo" alt="Logo">` : ''}
    ${logosDataURL.map(logo => {
      const clase = logo.posicion === 1 ? 'logo-izquierda' :
                    logo.posicion === 2 ? 'logo-derecha' :
                    'logo-centro';
      return `<img src="${logo.url}" class="${clase}" alt="Logo ${logo.posicion}">`;
    }).join('')}

    <div class="centro">
      <div class="titulo">${datos.titulo}</div>
      <div class="nombre">${datos.nombre}</div>
      <div class="${claseTexto}">${cuerpoFinal}</div>
      <div class="curso">"${datos.curso}"</div>
    </div>

    <div class="pie">
      <div class="datos">
        <div>Fecha: ${datos.fecha}</div>
        ${datos.horas ? `<div>Duración: ${datos.horas} horas</div>` : ''}
      </div>
    </div>

    <div class="qr-container">
      <img src="${qrDataURL}" class="qr" alt="QR">
      <div class="codigo">${codigo}</div>
    </div>

    ${firmasDataURL.length > 0 ? `
    <div class="firmas-container">
      ${firmasDataURL.map(firma => `
        <div class="firma-item">
          <img src="${firma.url}" class="firma-imagen" alt="Firma ${firma.nombre}">
          <div class="firma-linea"></div>
          <div class="firma-nombre">${firma.nombre}</div>
          <div class="firma-cargo">${firma.cargo}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer-text">
      Certificado generado por VAXA - Sistema de Certificación
    </div>
  </div>
</body>
</html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      });

      console.log(`PDF generado: ${outputPath}`);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}