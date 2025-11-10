// scripts/insertar-firmas-ejemplo.mjs
// Script de ejemplo para insertar firmas de muestra
// IMPORTANTE: Primero copia las imágenes a public/uploads/firmas/

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vaxa'
};

// DATOS DE EJEMPLO
// Modifica estos datos según tus necesidades
const firmasEjemplo = [
  {
    empresaId: 1,
    nombre: 'Dr. Juan Pérez López',
    cargo: 'Director Académico',
    firmaUrl: '/uploads/firmas/firma-juan-perez.png'
  },
  {
    empresaId: 1,
    nombre: 'Lic. María García Ramos',
    cargo: 'Coordinadora Académica',
    firmaUrl: '/uploads/firmas/firma-maria-garcia.png'
  },
  {
    empresaId: 1,
    nombre: 'Ing. Carlos López Martínez',
    cargo: 'Jefe de Capacitación',
    firmaUrl: '/uploads/firmas/firma-carlos-lopez.png'
  }
];

async function insertarFirmas() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🚀 Insertando firmas de ejemplo...\n');

    for (const firma of firmasEjemplo) {
      // Verificar si la empresa existe
      const [empresas] = await connection.query(
        'SELECT id, nombre FROM empresas WHERE id = ?',
        [firma.empresaId]
      );

      if (empresas.length === 0) {
        console.log(`⚠️  Empresa ${firma.empresaId} no existe, saltando...`);
        continue;
      }

      // Insertar firma
      const [result] = await connection.query(
        `INSERT INTO firmas_digitales
         (empresa_id, nombre, cargo, firma_url, estado, fecha_creacion, fecha_actualizacion)
         VALUES (?, ?, ?, ?, 'activo', NOW(), NOW())`,
        [firma.empresaId, firma.nombre, firma.cargo, firma.firmaUrl]
      );

      console.log(`✅ Firma insertada:`);
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Empresa: [${firma.empresaId}] ${empresas[0].nombre}`);
      console.log(`   Nombre: ${firma.nombre}`);
      console.log(`   Cargo: ${firma.cargo}`);
      console.log(`   URL: ${firma.firmaUrl}\n`);
    }

    // Mostrar resumen
    const [firmas] = await connection.query(`
      SELECT
        f.id,
        e.nombre AS empresa,
        f.nombre,
        f.cargo,
        f.estado
      FROM firmas_digitales f
      INNER JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.id DESC
      LIMIT 10
    `);

    console.log('\n📋 Últimas firmas insertadas:');
    console.table(firmas);

    console.log('\n✅ ¡Firmas de ejemplo insertadas exitosamente!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('   1. Verificar: node scripts/gestionar-firmas.mjs listar');
    console.log('   2. Copiar imágenes a: public/uploads/firmas/');
    console.log('   3. Probar API: http://localhost:3000/api/firmas?empresaId=1\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

insertarFirmas()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
