import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Usuario } from '@/lib/entities/Usuario';
import { Empresa } from '@/lib/entities/Empresa';
import { Certificado } from '@/lib/entities/Certificado';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // 1. Verificar token de la cookie
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      console.log('❌ No hay token en las cookies');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Verificar y decodificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token válido:', decoded);
    } catch (error) {
      console.log('❌ Token inválido:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);
    const usuarioRepo = dataSource.getRepository(Usuario);
    const certificadoRepo = dataSource.getRepository(Certificado);
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);

    // 3. Obtener empresa por slug
    const empresa = await empresaRepo.findOne({
      where: { slug }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // 4. Verificar que el usuario pertenece a esta empresa
    if (decoded.empresa_id !== empresa.id) {
      console.log('❌ Usuario no pertenece a esta empresa');
      return NextResponse.json(
        { error: 'No tienes acceso a esta empresa' },
        { status: 403 }
      );
    }

    // 5. Obtener datos del usuario
    const usuario = await usuarioRepo.findOne({
      where: { id: decoded.userId, activo: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 6. Obtener estadísticas de certificados
    const totalCertificados = await certificadoRepo.count({
      where: { empresa_id: empresa.id }
    });

    // Certificados del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const certificadosMes = await certificadoRepo
      .createQueryBuilder('certificado')
      .where('certificado.empresa_id = :empresaId', { empresaId: empresa.id })
      .andWhere('certificado.fecha_emision >= :inicioMes', { inicioMes })
      .getCount();

    // Último certificado para obtener fecha del último lote
    const ultimoCertificado = await certificadoRepo.findOne({
      where: { empresa_id: empresa.id },
      order: { fecha_emision: 'DESC' }
    });

    const stats = {
      total_certificados: totalCertificados,
      certificados_mes: certificadosMes,
      ultimo_lote: ultimoCertificado
        ? new Date(ultimoCertificado.fecha_emision).toLocaleDateString('es-PE')
        : null
    };

    // 7. Obtener configuración de plantilla
    const plantillaConfig = await plantillaRepo.findOne({
      where: { empresa_id: empresa.id }
    });

    // 8. Respuesta con datos del dashboard
    return NextResponse.json({
      empresa: {
        id: empresa.id,
        slug: empresa.slug,
        nombre: empresa.nombre,
        logo: empresa.logo,
        color_primario: empresa.color_primario,
        color_secundario: empresa.color_secundario
      },
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role
      },
      stats,
      plantillaConfigId: plantillaConfig?.id || null
    });

  } catch (error) {
    console.error('Error en dashboard API:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}