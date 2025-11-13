// ============================================
// API: POST /api/certificados/[certificadoId]/regenerar
// FIX: Usar SOLO textoEstatico del input, NADA de BD
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
import { CertificadoFirma } from '@/lib/entities/CertificadoFirma';
import { FirmaDigital } from '@/lib/entities/FirmaDigital';
import { PDFService } from '@/lib/services/PDFService';
import { QRService } from '@/lib/services/QRService';
import { PlantillaService } from '@/lib/services/PlantillaService';
import path from 'path';
import fs from 'fs';

const CONFIG_ESTANDAR = {
  QR: {
    baseSize: 180
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json(
        { error: 'ID de certificado inválido' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const nombrePersonalizado = body.nombrePersonalizado || null;
    const textoEstatico = body.textoEstatico; // 🆕 OBLIGATORIO - sin valor por defecto

    // 🆕 VALIDAR QUE textoEstatico VENGA EN EL BODY
    if (!textoEstatico) {
      return NextResponse.json(
        { error: 'El campo textoEstatico es requerido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);

    // Obtener el certificado con todas sus relaciones
    const certificado = await certificadoRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participante', 'p')
      .leftJoinAndSelect('c.lote', 'l')
      .leftJoinAndSelect('l.empresa', 'e')
      .leftJoinAndSelect('c.datos', 'd')
      .where('c.id = :certificadoId', { certificadoId })
      .getOne();

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    if (!certificado.lote || !certificado.participante) {
      return NextResponse.json(
        { error: 'Certificado sin lote o participante asociado' },
        { status: 400 }
      );
    }

    console.log(`🔄 Regenerando certificado ${certificado.id} para participante ${certificado.participante.id}`);
    console.log(`   Empresa ID: ${certificado.lote.empresa.id}`);
    console.log(`   Lote ID: ${certificado.lote.id}`);

    // 1. Obtener plantilla con logos
    console.log(`   📋 Obteniendo plantilla...`);
    const plantilla = await PlantillaService.obtenerPlantillaBasica(certificado.lote.empresa.id);
    console.log(`   ✅ Plantilla obtenida:`, plantilla ? 'OK' : 'NULL');

    if (!plantilla) {
      return NextResponse.json(
        { error: 'No hay plantilla para esta empresa' },
        { status: 404 }
      );
    }

    // 2. Obtener firmas del certificado original
    console.log(`   ✍️  Obteniendo firmas...`);
    const certificadoFirmasRepo = dataSource.getRepository(CertificadoFirma);
    const certificadoFirmas = await certificadoFirmasRepo
      .createQueryBuilder('cf')
      .where('cf.certificadoId = :certificadoId', { certificadoId })
      .orderBy('cf.orden', 'ASC')
      .getMany();

    const firmasParaCertificado = [];
    if (certificadoFirmas.length > 0) {
      const firmaIds = certificadoFirmas.map(cf => cf.firmaId);
      const firmasRepo = dataSource.getRepository(FirmaDigital);
      const firmas = await firmasRepo
        .createQueryBuilder('f')
        .where('f.id IN (:...ids)', { ids: firmaIds })
        .getMany();

      for (const cf of certificadoFirmas) {
        const firma = firmas.find(f => f.id === cf.firmaId);
        if (firma) {
          firmasParaCertificado.push({
            id: firma.id,
            nombre: firma.nombre,
            cargo: firma.cargo,
            firmaUrl: firma.firmaUrl
          });
        }
      }
    }
    console.log(`   ✅ Firmas obtenidas: ${firmasParaCertificado.length}`);

    // 3. 🚨 SOLO USAR TEXTO ESTÁTICO DEL INPUT - NADA DE BD
    console.log(`📋 === TEXTO EXCLUSIVAMENTE DEL INPUT ===`);
    
    let titulo = 'CERTIFICADO DE PARTICIPACIÓN';
    
    // 🆕 OBTENER TÍTULO (puede venir del body o de BD)
    if (body.titulo) {
      titulo = body.titulo;
      console.log(`✅ Usando título del body: "${titulo}"`);
    } else {
      const tituloGuardado = certificado.datos.find(d => d.campo === '_titulo');
      if (tituloGuardado && tituloGuardado.valor) {
        titulo = tituloGuardado.valor;
        console.log(`✅ Usando título de BD: "${titulo}"`);
      }
    }

    // 🆕 TEXTO DEL CUERPO - SOLO DEL INPUT, OBLIGATORIO
    const textoCompletado = textoEstatico;
    console.log(`✅✅✅ TEXTO ESTÁTICO DEL INPUT: "${textoCompletado.substring(0, 100)}..."`);

    console.log(`\n📝 TEXTO FINAL PARA PDF:`);
    console.log(`   Título: "${titulo}"`);
    console.log(`   Cuerpo: "${textoCompletado.substring(0, 100)}..."`);

    // 4. Generar QR con el mismo código
    const qrDataURL = await QRService.generarQRParaCertificado(
      certificado.codigo,
      CONFIG_ESTANDAR.QR.baseSize
    );

    // 5. Construir nombre completo ACTUALIZADO
    let nombreCompleto: string;

    if (nombrePersonalizado) {
      nombreCompleto = nombrePersonalizado.trim();
      console.log(`   🆕 Usando nombre personalizado de la petición: "${nombreCompleto}"`);
    } else {
      const nombreOverride = certificado.datos.find(d => d.campo === '_nombre_override');

      if (nombreOverride && nombreOverride.valor) {
        nombreCompleto = nombreOverride.valor.trim();
        console.log(`   ✏️ Usando nombre override guardado: "${nombreCompleto}"`);
      } else {
        nombreCompleto = [
          certificado.participante.termino,
          certificado.participante.nombres
        ].filter(Boolean).join(' ').trim();
        console.log(`   👤 Usando nombre del participante: "${nombreCompleto}"`);
      }
    }

    // 6. Obtener datos adicionales del certificado
    const datosAdicionales: { [key: string]: string } = {};
    certificado.datos.forEach(dato => {
      datosAdicionales[dato.campo] = dato.valor;
    });

    // 7. Preparar datos para el PDF
    const datosPDF = {
      titulo: titulo,
      nombre: nombreCompleto,
      curso: certificado.lote.curso || datosAdicionales['curso'] || 'Sin curso',
      fecha: datosAdicionales['Fecha de Emisión'] || datosAdicionales['fecha'] || new Date().toLocaleDateString('es-PE'),
      horas: datosAdicionales['Horas Académicas'] || datosAdicionales['horas'] || '',
      cuerpo: textoCompletado // 🆕 SOLO texto del input
    };

    console.log(`   📄 Datos del PDF:`, datosPDF);

    // 8. CREAR DIRECTORIO SI NO EXISTE
    const pdfPath = path.join(process.cwd(), 'public', certificado.archivo_url);
    const pdfDir = path.dirname(pdfPath);
    
    console.log(`   📁 Ruta PDF: ${pdfPath}`);
    console.log(`   📁 Directorio: ${pdfDir}`);
    
    if (!fs.existsSync(pdfDir)) {
      console.log(`   📁 Directorio no existe, creando...`);
      fs.mkdirSync(pdfDir, { recursive: true });
      console.log(`   ✅ Directorio creado`);
    } else {
      console.log(`   ✅ Directorio ya existe`);
    }

    // 9. Regenerar el PDF con los datos actualizados
    console.log(`   🎨 Generando PDF...`);

    await PDFService.generarCertificadoPDF({
      plantillaFondo: plantilla.fondo,
      logoEmpresa: plantilla.logo || undefined,
      logos: plantilla.logos.map(logo => ({
        url: logo.url,
        posicion: logo.posicion
      })),
      firmas: firmasParaCertificado,
      datos: datosPDF,
      codigo: certificado.codigo,
      qrDataURL: qrDataURL,
      outputPath: pdfPath
    });

    // 🆕 GUARDAR TEXTO ESTÁTICO EN BD PARA FUTURAS REGENERACIONES
    if (nombrePersonalizado || textoEstatico) {
      const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);
      
      if (nombrePersonalizado) {
        const overrideExistente = certificado.datos.find(d => d.campo === '_nombre_override');
        if (overrideExistente) {
          overrideExistente.valor = nombrePersonalizado;
          await datoCertificadoRepo.save(overrideExistente);
        } else {
          const nuevoOverride = datoCertificadoRepo.create({
            certificado_id: certificado.id,
            campo: '_nombre_override',
            valor: nombrePersonalizado
          });
          await datoCertificadoRepo.save(nuevoOverride);
        }
        console.log(`   💾 Nombre override guardado en BD`);
      }

      // 🆕 GUARDAR TEXTO ESTÁTICO EN BD
      const textoEstaticoExistente = certificado.datos.find(d => d.campo === '_texto_estatico');
      if (textoEstaticoExistente) {
        textoEstaticoExistente.valor = textoEstatico;
        await datoCertificadoRepo.save(textoEstaticoExistente);
      } else {
        const nuevoTextoEstatico = datoCertificadoRepo.create({
          certificado_id: certificado.id,
          campo: '_texto_estatico',
          valor: textoEstatico
        });
        await datoCertificadoRepo.save(nuevoTextoEstatico);
      }
      console.log(`   💾 Texto estático guardado en BD`);
    }

    console.log(`✅ PDF regenerado exitosamente`);
    console.log(`   Código: ${certificado.codigo}`);
    console.log(`   Participante actualizado: "${nombreCompleto}"`);
    console.log(`   Texto usado: "${textoCompletado.substring(0, 50)}..."`);
    console.log(`   PDF: ${certificado.archivo_url}`);

    return NextResponse.json({
      success: true,
      certificado: {
        id: certificado.id,
        codigo: certificado.codigo,
        archivo_url: certificado.archivo_url,
        participante: nombreCompleto,
        texto_estatico: textoCompletado
      }
    });

  } catch (error) {
    console.error('❌ ERROR COMPLETO al regenerar certificado:');
    console.error('   Tipo:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Mensaje:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Error al regenerar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}