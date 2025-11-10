import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuración de BD
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'vaxa',
  multipleStatements: true
};

function log(mensaje, color = 'reset') {
  const colores = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
  };
  console.log(`${colores[color]}${mensaje}${colores.reset}`);
}

async function ejecutarMigracion() {
  let connection;

  try {
    log('\n🚀 EJECUTANDO MIGRACIÓN COMPLETA\n', 'cyan');

    // 1. Leer archivo SQL
    const sqlFile = path.join(__dirname, 'EJECUTAR-AHORA-fix-completo.sql');

    if (!fs.existsSync(sqlFile)) {
      throw new Error(`No se encontró el archivo: ${sqlFile}`);
    }

    log('📄 Leyendo archivo SQL...', 'blue');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 2. Conectar a BD
    log('🔌 Conectando a base de datos...', 'blue');
    connection = await mysql.createConnection(dbConfig);
    log('✅ Conexión exitosa', 'green');

    // 3. Ejecutar SQL
    log('\n⚙️  Ejecutando migraciones...', 'blue');
    log('─'.repeat(60), 'cyan');

    const [results] = await connection.query(sql);

    // 4. Mostrar resultados
    log('\n📊 RESULTADOS:', 'cyan');
    log('─'.repeat(60), 'cyan');

    // El resultado puede ser un array de arrays
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.table(result);
        }
      });
    }

    // 5. Verificaciones adicionales
    log('\n🔍 VERIFICACIONES FINALES:', 'cyan');
    log('─'.repeat(60), 'cyan');

    // Verificar tabla certificado_firmas
    const [cfExists] = await connection.query(`
      SELECT COUNT(*) as existe
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
      AND TABLE_NAME = 'certificado_firmas'
    `);

    if (cfExists[0].existe) {
      log('✅ Tabla certificado_firmas: OK', 'green');
    } else {
      log('❌ Tabla certificado_firmas: NO EXISTE', 'red');
    }

    // Verificar columnas nuevas en certificados
    const [columnas] = await connection.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
      AND TABLE_NAME = 'certificados'
      AND COLUMN_NAME IN ('curso_nombre', 'horas_curso')
    `);

    if (columnas.length === 2) {
      log('✅ Columnas curso_nombre y horas_curso: OK', 'green');
    } else {
      log(`⚠️  Solo se encontraron ${columnas.length} de 2 columnas esperadas`, 'yellow');
    }

    // Verificar firmas digitales
    const [firmas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM firmas_digitales
      WHERE estado = 'activo'
    `);

    log(`✅ Firmas digitales activas: ${firmas[0].total}`, 'green');

    // 6. Mostrar estructura final
    log('\n📋 ESTRUCTURA FINAL:', 'cyan');
    log('─'.repeat(60), 'cyan');

    const [estructura] = await connection.query(`
      DESCRIBE certificados
    `);

    console.table(estructura.filter(col =>
      ['id', 'codigo', 'curso_id', 'curso_nombre', 'horas_curso', 'archivo_url', 'estado'].includes(col.Field)
    ));

    log('\n✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!', 'green');
    log('─'.repeat(60), 'cyan');
    log('\n📖 PRÓXIMOS PASOS:', 'yellow');
    log('\n1. Crear entidad CertificadoFirma en TypeORM', 'blue');
    log('2. Modificar API /api/generar-certificados', 'blue');
    log('3. Actualizar frontend para enviar curso_nombre y firmas', 'blue');
    log('4. Modificar PDFService para usar firmas de BD', 'blue');
    log('\n🎉 ¡Todo listo para continuar!', 'green');
    log('');

  } catch (error) {
    log('\n❌ ERROR EN MIGRACIÓN:', 'red');
    log(error.message, 'red');
    if (error.sql) {
      log('\nSQL que causó el error:', 'yellow');
      log(error.sql, 'yellow');
    }
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
ejecutarMigracion();
