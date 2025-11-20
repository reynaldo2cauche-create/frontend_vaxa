// ============================================
// 📁 app/api/auth/verify/route.ts
// Verificar token y obtener usuario actual
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Usuario } from '@/lib/entities/Usuario';
import { Empresa } from '@/lib/entities/Empresa';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      empresa_id: number;
    };

    const dataSource = await getDataSource();
    const usuarioRepo = dataSource.getRepository(Usuario);
    const empresaRepo = dataSource.getRepository(Empresa);

    const usuario = await usuarioRepo.findOne({
      where: { id: decoded.userId, activo: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const empresa = await empresaRepo.findOne({
      where: { id: usuario.empresa_id }
    });

    return NextResponse.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role,
        empresa_id: usuario.empresa_id
      },
      empresa: empresa ? {
        id: empresa.id,
        slug: empresa.slug,
        nombre: empresa.nombre,
        logo: empresa.logo,
        color_primario: empresa.color_primario,
        color_secundario: empresa.color_secundario
      } : null
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}