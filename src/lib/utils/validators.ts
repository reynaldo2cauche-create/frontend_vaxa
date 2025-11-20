// src/lib/utils/validators.ts

import { z } from 'zod';

/**
 * Validadores usando Zod para garantizar tipos seguros
 */

// ===== VALIDACIÓN DE EMPRESA =====
export const EmpresaSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(3).max(100),
  email: z.string().email(),
  color_primario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  color_secundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

// ===== VALIDACIÓN DE USUARIO =====
export const UsuarioSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(['admin', 'usuario'])
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  empresa_slug: z.string().min(1)
});

// ===== VALIDACIÓN DE CERTIFICADO =====
export const CodigoSchema = z.string().regex(/^VAXA-\d+-\d+-[a-zA-Z0-9]+$/);

export const DatosCertificadoSchema = z.record(z.string(), z.string());

// ===== VALIDACIÓN DE CONFIGURACIÓN =====
export const CampoConfigSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  size: z.number().min(8).max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  font: z.string(),
  align: z.enum(['left', 'center', 'right']).optional()
});

export const PlantillaConfigSchema = z.object({
  fondo: z.string(),
  ancho: z.number().min(100).max(5000),
  alto: z.number().min(100).max(5000),
  campos: z.record(z.string(), CampoConfigSchema),
  qr: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    size: z.number().min(50).max(500)
  }),
  codigo: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    size: z.number().min(8).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  })
});

// ===== VALIDACIÓN DE GENERACIÓN =====
export const GeneracionSchema = z.object({
  empresa_id: z.number().positive(),
  nombre_lote: z.string().min(1).max(200),
  mapeo: z.record(z.string(), z.string())
});

// ===== VALIDACIÓN DE ARCHIVOS =====
export function validarArchivoExcel(file: File): { valido: boolean; error?: string } {
  // Validar extensión
  const extensionesValidas = ['.xlsx', '.xls'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

  if (!extensionesValidas.includes(extension)) {
    return {
      valido: false,
      error: 'El archivo debe ser formato Excel (.xlsx o .xls)'
    };
  }

  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valido: false,
      error: 'El archivo no debe superar los 10MB'
    };
  }

  // Validar tipo MIME
  const mimeTypesValidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream' // A veces Excel viene así
  ];

  if (file.type && !mimeTypesValidos.includes(file.type)) {
    return {
      valido: false,
      error: 'Tipo de archivo no válido'
    };
  }

  return { valido: true };
}

export function validarImagen(file: File): { valido: boolean; error?: string } {
  // Validar tipo
  const tiposValidos = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!tiposValidos.includes(file.type)) {
    return {
      valido: false,
      error: 'La imagen debe ser PNG o JPEG'
    };
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valido: false,
      error: 'La imagen no debe superar los 5MB'
    };
  }

  return { valido: true };
}

// ===== VALIDADORES CUSTOM =====
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarSlug(slug: string): boolean {
  const regex = /^[a-z0-9-]+$/;
  return regex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export function validarColor(color: string): boolean {
  const regex = /^#[0-9A-Fa-f]{6}$/;
  return regex.test(color);
}

export function validarCodigoCertificado(codigo: string): boolean {
  const regex = /^VAXA-\d+-\d+-[a-zA-Z0-9]+$/;
  return regex.test(codigo);
}

// ===== SANITIZACIÓN =====
export function sanitizarTexto(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .replace(/[<>]/g, ''); // Remover < y >
}

export function sanitizarHTML(texto: string): string {
  return texto
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ===== VALIDACIÓN DE DATOS =====
export function validarDatosCompletos(
  datos: { [key: string]: any },
  camposRequeridos: string[]
): { valido: boolean; faltantes: string[] } {
  const faltantes = camposRequeridos.filter(campo => {
    const valor = datos[campo];
    return !valor || valor.toString().trim() === '';
  });

  return {
    valido: faltantes.length === 0,
    faltantes
  };
}