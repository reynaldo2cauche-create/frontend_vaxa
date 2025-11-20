// src/lib/uploads.ts  ← NOMBRE CORRECTO

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Guarda una imagen en el servidor
 */
export async function subirImagen(
  buffer: Buffer,
  folder: string = 'logos'
): Promise<string> {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.png`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    throw new Error('Error al guardar la imagen');
  }
}