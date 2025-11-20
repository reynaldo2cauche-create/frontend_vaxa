import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'vaxa',
  multipleStatements: true
};

async function setup() {
  let connection;
  try {
    console.log('🚀 Configurando Sistema de Firmas Digitales...\n');
    connection = await mysql.createConnection(dbConfig);

    // Deshabilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Eliminar tablas si existen
    console.log('📝 Eliminando tablas antiguas...');
    await connection.query('DROP TABLE IF EXISTS `certificado_firmas`');
    await connection.query('DROP TABLE IF EXISTS `firmas_digitales`');
    console.log('✅ Tablas antiguas eliminadas\n');

    // Crear tabla firmas_digitales
    console.log('📝 Creando tabla firmas_digitales...');
    await connection.query(`
      CREATE TABLE \`firmas_digitales\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`empresa_id\` INT NOT NULL,
        \`nombre\` VARCHAR(255) NOT NULL COMMENT 'Nombre completo de la persona que firma',
        \`cargo\` VARCHAR(255) NOT NULL COMMENT 'Cargo/puesto de la persona',
        \`firma_url\` VARCHAR(500) NOT NULL COMMENT 'Ruta de la imagen de la firma',
        \`estado\` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
        \`fecha_creacion\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`fecha_actualizacion\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_empresa\` (\`empresa_id\`),
        INDEX \`idx_estado\` (\`estado\`),
        INDEX \`idx_empresa_estado\` (\`empresa_id\`, \`estado\`),
        CONSTRAINT \`fk_firmas_digitales_empresa\`
          FOREIGN KEY (\`empresa_id\`)
          REFERENCES \`empresas\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla firmas_digitales creada\n');

    // Crear tabla certificado_firmas
    console.log('📝 Creando tabla certificado_firmas...');
    await connection.query(`
      CREATE TABLE \`certificado_firmas\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`certificado_id\` BIGINT NOT NULL,
        \`firma_id\` INT NOT NULL,
        \`orden\` INT NOT NULL COMMENT 'Orden: 1, 2 o 3',
        \`fecha_asignacion\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_certificado\` (\`certificado_id\`),
        INDEX \`idx_firma\` (\`firma_id\`),
        INDEX \`idx_certificado_firma\` (\`certificado_id\`, \`firma_id\`),
        UNIQUE KEY \`unique_certificado_firma\` (\`certificado_id\`, \`firma_id\`),
        CONSTRAINT \`fk_certificado_firmas_certificado\`
          FOREIGN KEY (\`certificado_id\`)
          REFERENCES \`certificados\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT \`fk_certificado_firmas_firma\`
          FOREIGN KEY (\`firma_id\`)
          REFERENCES \`firmas_digitales\` (\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla certificado_firmas creada\n');

    // Habilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Verificaciones
    console.log('🔍 Verificando tablas creadas...\n');

    const [tables] = await connection.query("SHOW TABLES LIKE 'firmas%'");
    console.log('Tablas de firmas:');
    console.table(tables);

    const [estructura] = await connection.query('DESCRIBE firmas_digitales');
    console.log('\n📋 Estructura de firmas_digitales:');
    console.table(estructura);

    const [empresas] = await connection.query(`
      SELECT
        e.id,
        e.nombre AS empresa,
        COUNT(f.id) AS total_firmas,
        SUM(CASE WHEN f.estado = 'activo' THEN 1 ELSE 0 END) AS firmas_activas
      FROM empresas e
      LEFT JOIN firmas_digitales f ON e.id = f.empresa_id
      GROUP BY e.id, e.nombre
      ORDER BY e.id
    `);

    console.log('\n📊 Firmas por empresa:');
    console.table(empresas);

    console.log('\n✅ ========================================');
    console.log('   SISTEMA DE FIRMAS CONFIGURADO');
    console.log('========================================\n');
    console.log('📝 PRÓXIMOS PASOS:');
    console.log('   1. Crear carpeta: mkdir public/uploads/firmas');
    console.log('   2. Ejecutar: node scripts/gestionar-firmas.mjs help');
    console.log('   3. Reiniciar servidor: npm run dev\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
