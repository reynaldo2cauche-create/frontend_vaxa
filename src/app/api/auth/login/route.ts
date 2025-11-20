import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Usuario } from '@/lib/entities/Usuario';
import { Empresa } from '@/lib/entities/Empresa';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

export async function POST(request: NextRequest) {
  try {
    const { email, password, empresa_id } = await request.json();

    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Empresa ID:', empresa_id);

    // Validaciones
    if (!email || !password || !empresa_id) {
      return NextResponse.json(
        { error: 'Email, contraseña y empresa son requeridos' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const usuarioRepo = dataSource.getRepository(Usuario);
    const empresaRepo = dataSource.getRepository(Empresa);

    // Buscar usuario CON LOGS
    console.log('Buscando usuario con:', {
      email: email.toLowerCase(),
      empresa_id: empresa_id,
      activo: true
    });

    const usuario = await usuarioRepo.findOne({
      where: { 
        email: email.toLowerCase(),
        empresa_id: empresa_id,
        activo: true
      },
      relations: ['empresa']
    });

    console.log('Usuario encontrado:', usuario ? 'SÍ' : 'NO');
    
    if (usuario) {
      console.log('Datos usuario:', {
        id: usuario.id,
        email: usuario.email,
        empresa_id: usuario.empresa_id,
        activo: usuario.activo,
        hash_length: usuario.password?.length
      });
    }

    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    console.log('Verificando contraseña...');
    console.log('Hash en BD:', usuario.password);
    console.log('Password ingresado:', password);
    
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Obtener empresa completa
    const empresa = await empresaRepo.findOne({
      where: { id: empresa_id }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Generar JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        role: usuario.role,
        empresa_id: usuario.empresa_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Respuesta exitosa
    const response = NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role,
        empresa_id: usuario.empresa_id
      },
      empresa: {
        id: empresa.id,
        slug: empresa.slug,
        nombre: empresa.nombre,
        logo: empresa.logo,
        color_primario: empresa.color_primario,
        color_secundario: empresa.color_secundario
      },
      token
    });

    // Setear cookie con el token
    response.cookies.set('vaxa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return response;

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

