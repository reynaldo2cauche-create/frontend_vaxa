// ============================================
// API: PUT /api/certificados/[certificadoId]
// Edita un certificado y regenera el PDF
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
import { Participante, TipoDocumento } from '@/lib/entities/Participante';
import { Curso } from '@/lib/entities/Curso';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';
import { Logo } from '@/lib/entities/Logo';
import { CertificadoFirma } from '@/lib/entities/CertificadoFirma';
import { PDFService } from '@/lib/services/PDFService';
import { verifyToken } from '@/lib/auth';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function PUT(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    // Verificar autenticación desde cookies
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json({ error: 'ID de certificado inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { datosAdicionales, participante, curso } = body;

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);
    const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);
    const participanteRepo = dataSource.getRepository(Participante);
    const cursoRepo = dataSource.getRepository(Curso);
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);

    // Obtener certificado existente
    const certificado = await certificadoRepo.findOne({
      where: { id: certificadoId, empresa_id: decoded.empresa_id },
      relations: ['participante', 'curso']
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    console.log(`📝 Editando certificado ${certificado.codigo}...`);

    // 1. Actualizar participante si se proporcionó
    if (participante) {
      let participanteEntity = certificado.participante;

      if (participanteEntity) {
        // Actualizar participante existente
        if (participante.nombres) participanteEntity.nombres = participante.nombres;
        if (participante.apellidos) participanteEntity.apellidos = participante.apellidos;
        if (participante.numeroDocumento) participanteEntity.numero_documento = participante.numeroDocumento;
        if (participante.correo) participanteEntity.correo_electronico = participante.correo;
        if (participante.telefono) participanteEntity.telefono = participante.telefono;
        if (participante.ciudad) participanteEntity.ciudad = participante.ciudad;
        if (participante.termino !== undefined) participanteEntity.termino = participante.termino;

        if (participante.tipoDocumento) {
          const tipoStr = String(participante.tipoDocumento).toUpperCase();
          if (tipoStr.includes('DNI')) participanteEntity.tipo_documento = TipoDocumento.DNI;
          else if (tipoStr.includes('CE')) participanteEntity.tipo_documento = TipoDocumento.CE;
          else if (tipoStr.includes('RUC')) participanteEntity.tipo_documento = TipoDocumento.RUC;
          else if (tipoStr.includes('PASAPORTE')) participanteEntity.tipo_documento = TipoDocumento.PASAPORTE;
          else if (tipoStr.includes('OTRO')) participanteEntity.tipo_documento = TipoDocumento.OTRO;
        }

        await participanteRepo.save(participanteEntity);
        console.log(`   ✅ Participante actualizado: ${participanteEntity.nombres} ${participanteEntity.apellidos}`);
      } else if (participante.nombres && participante.apellidos) {
        // Crear nuevo participante
        let tipoDoc = TipoDocumento.DNI;
        if (participante.tipoDocumento) {
          const tipoStr = String(participante.tipoDocumento).toUpperCase();
          if (tipoStr.includes('DNI')) tipoDoc = TipoDocumento.DNI;
          else if (tipoStr.includes('CE')) tipoDoc = TipoDocumento.CE;
          else if (tipoStr.includes('RUC')) tipoDoc = TipoDocumento.RUC;
          else if (tipoStr.includes('PASAPORTE')) tipoDoc = TipoDocumento.PASAPORTE;
          else if (tipoStr.includes('OTRO')) tipoDoc = TipoDocumento.OTRO;
        }

        participanteEntity = participanteRepo.create({
          empresa_id: decoded.empresa_id,
          tipo_documento: tipoDoc,
          numero_documento: participante.numeroDocumento || '',
          termino: participante.termino || null,
          nombres: participante.nombres,
          apellidos: participante.apellidos,
          correo_electronico: participante.correo || null,
          telefono: participante.telefono || null,
          ciudad: participante.ciudad || null
        });

        await participanteRepo.save(participanteEntity);
        certificado.participante_id = participanteEntity.id;
        console.log(`   ✅ Participante creado: ${participanteEntity.nombres} ${participanteEntity.apellidos}`);
      }
    }

    // 2. Actualizar curso si se proporcionó
    if (curso) {
      let cursoEntity = certificado.curso;

      if (cursoEntity) {
        // Actualizar curso existente
        if (curso.nombre) cursoEntity.nombre = curso.nombre;
        if (curso.horasAcademicas !== undefined) cursoEntity.horas_academicas = curso.horasAcademicas;
        if (curso.ponente) cursoEntity.ponente = curso.ponente;
        if (curso.fechaInicio) cursoEntity.fecha_inicio = new Date(curso.fechaInicio);
        if (curso.fechaFin) cursoEntity.fecha_fin = new Date(curso.fechaFin);
        if (curso.modalidad) cursoEntity.modalidad = curso.modalidad;

        await cursoRepo.save(cursoEntity);
        console.log(`   ✅ Curso actualizado: ${cursoEntity.nombre}`);
      } else if (curso.nombre) {
        // Crear nuevo curso
        cursoEntity = cursoRepo.create({
          empresa_id: decoded.empresa_id,
          nombre: curso.nombre,
          horas_academicas: curso.horasAcademicas || null,
          ponente: curso.ponente || null,
          fecha_inicio: curso.fechaInicio ? new Date(curso.fechaInicio) : null,
          fecha_fin: curso.fechaFin ? new Date(curso.fechaFin) : null,
          modalidad: curso.modalidad || null
        });

        await cursoRepo.save(cursoEntity);
        certificado.curso_id = cursoEntity.id;
        console.log(`   ✅ Curso creado: ${cursoEntity.nombre}`);
      }
    }

    // 3. Actualizar datos adicionales
    if (datosAdicionales) {
      // Eliminar datos adicionales antiguos
      await datoCertificadoRepo.delete({ certificado_id: certificadoId });

      // Crear nuevos datos adicionales
      for (const [campo, valor] of Object.entries(datosAdicionales)) {
        if (valor !== null && valor !== undefined) {
          const dato = datoCertificadoRepo.create({
            certificado_id: certificadoId,
            campo,
            valor: String(valor)
          });
          await datoCertificadoRepo.save(dato);
        }
      }
      console.log(`   ✅ Datos adicionales actualizados (${Object.keys(datosAdicionales).length} campos)`);
    }

    // 4. Regenerar PDF
    console.log('   🔄 Regenerando PDF...');

    // Obtener plantilla de la empresa
    const plantilla = await plantillaRepo.findOne({
      where: { empresa_id: decoded.empresa_id }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'No se encontró plantilla para la empresa' },
        { status: 400 }
      );
    }

    // Preparar datos para PDF
    const nombreCompleto = certificado.participante
      ? `${certificado.participante.nombres} ${certificado.participante.apellidos}`.trim()
      : 'Sin nombre';

    const nombreCurso = certificado.curso?.nombre || 'Sin curso';
    const fechaEmision = certificado.fecha_emision?.toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES');
    const horasAcademicas = certificado.curso?.horas_academicas?.toString() || '';

    const datosPDF = {
      titulo: 'CERTIFICADO',
      nombre: nombreCompleto,
      curso: nombreCurso,
      fecha: fechaEmision,
      horas: horasAcademicas,
      cuerpo: `Por haber completado satisfactoriamente el curso ${nombreCurso}`
    };

    // Generar código QR
    const urlValidacion = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/validar/?codigo=${certificado.codigo}`;
    const qrDataURL = await QRCode.toDataURL(urlValidacion, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Eliminar PDF anterior si existe
    if (certificado.archivo_url) {
      const rutaAnterior = path.join(process.cwd(), 'public', certificado.archivo_url);
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
        console.log(`   🗑️  PDF anterior eliminado`);
      }
    }

    // Obtener logos de la empresa
    const logoRepo = dataSource.getRepository(Logo);
    const logos = await logoRepo.find({
      where: { empresa_id: decoded.empresa_id },
      order: { posicion: 'ASC' }
    });

    const logosParaPDF = logos.map((logo) => ({
      url: logo.url,
      posicion: logo.posicion
    }));

    // Obtener firmas asociadas al certificado
    const certificadoFirmaRepo = dataSource.getRepository(CertificadoFirma);
    const certificadoFirmas = await certificadoFirmaRepo.find({
      where: { certificado_id: certificadoId },
      relations: ['firma'],
      order: { orden: 'ASC' }
    });

    const firmasParaPDF = certificadoFirmas.slice(0, 3).map((cf) => ({
      nombre: cf.firma.nombre,
      cargo: cf.firma.cargo,
      firmaUrl: cf.firma.firmaUrl
    }));

    // Preparar ruta para el nuevo PDF
    const outputDir = path.join(process.cwd(), 'public', 'certificados', decoded.empresa_id.toString());
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filename = `${certificado.codigo}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // Generar nuevo PDF con logos y firmas
    await PDFService.generarCertificadoPDF({
      plantillaFondo: plantilla.imagen_fondo,
      logos: logosParaPDF,
      firmas: firmasParaPDF,
      datos: datosPDF,
      codigo: certificado.codigo,
      qrDataURL,
      outputPath
    });

    // Actualizar URL del archivo en el certificado
    const rutaPDF = `/certificados/${decoded.empresa_id}/${filename}`;
    certificado.archivo_url = rutaPDF;
    await certificadoRepo.save(certificado);

    console.log(`   ✅ PDF regenerado: ${rutaPDF}`);
    console.log(`✅ Certificado ${certificado.codigo} editado exitosamente`);

    // Obtener certificado actualizado con todas las relaciones
    const certificadoActualizado = await certificadoRepo.findOne({
      where: { id: certificadoId },
      relations: ['participante', 'curso']
    });

    const datosActualizados = await datoCertificadoRepo.find({
      where: { certificado_id: certificadoId }
    });

    const datosMap: Record<string, string> = {};
    datosActualizados.forEach(dato => {
      datosMap[dato.campo] = dato.valor;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: certificadoActualizado!.id,
        codigo: certificadoActualizado!.codigo,
        archivoUrl: certificadoActualizado!.archivo_url,
        fechaEmision: certificadoActualizado!.fecha_emision,
        estado: certificadoActualizado!.estado,
        participante: certificadoActualizado!.participante ? {
          id: certificadoActualizado!.participante.id,
          nombres: certificadoActualizado!.participante.nombres,
          apellidos: certificadoActualizado!.participante.apellidos,
          numeroDocumento: certificadoActualizado!.participante.numero_documento,
          correo: certificadoActualizado!.participante.correo_electronico
        } : null,
        curso: certificadoActualizado!.curso ? {
          id: certificadoActualizado!.curso.id,
          nombre: certificadoActualizado!.curso.nombre,
          horasAcademicas: certificadoActualizado!.curso.horas_academicas,
          ponente: certificadoActualizado!.curso.ponente
        } : null,
        datosAdicionales: datosMap
      }
    });

  } catch (error) {
    console.error('Error al editar certificado:', error);
    return NextResponse.json(
      { error: 'Error al editar certificado' },
      { status: 500 }
    );
  }
}

// ============================================
// API: GET /api/certificados/[certificadoId]
// Obtiene los detalles de un certificado
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    // Verificar autenticación desde cookies
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json({ error: 'ID de certificado inválido' }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);
    const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);

    const certificado = await certificadoRepo.findOne({
      where: { id: certificadoId, empresa_id: decoded.empresa_id },
      relations: ['participante', 'curso']
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    const datosCert = await datoCertificadoRepo.find({
      where: { certificado_id: certificadoId }
    });

    const datosMap: Record<string, string> = {};
    datosCert.forEach(dato => {
      datosMap[dato.campo] = dato.valor;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: certificado.id,
        codigo: certificado.codigo,
        archivoUrl: certificado.archivo_url,
        fechaEmision: certificado.fecha_emision,
        estado: certificado.estado,
        participante: certificado.participante ? {
          id: certificado.participante.id,
          nombres: certificado.participante.nombres,
          apellidos: certificado.participante.apellidos,
          numeroDocumento: certificado.participante.numero_documento,
          correo: certificado.participante.correo_electronico,
          telefono: certificado.participante.telefono,
          ciudad: certificado.participante.ciudad,
          termino: certificado.participante.termino,
          tipoDocumento: certificado.participante.tipo_documento
        } : null,
        curso: certificado.curso ? {
          id: certificado.curso.id,
          nombre: certificado.curso.nombre,
          horasAcademicas: certificado.curso.horas_academicas,
          ponente: certificado.curso.ponente,
          fechaInicio: certificado.curso.fecha_inicio,
          fechaFin: certificado.curso.fecha_fin,
          modalidad: certificado.curso.modalidad
        } : null,
        datosAdicionales: datosMap
      }
    });

  } catch (error) {
    console.error('Error al obtener certificado:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificado' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
