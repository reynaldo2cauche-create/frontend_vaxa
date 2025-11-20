import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuración de BD
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vaxa'
};

// URLs de firmas de ejemplo (imágenes de firmas realistas)
const firmasEjemplo = [
  {
    url: 'https://i.imgur.com/5QwzX8K.png', // Firma 1
    nombre: 'firma-director.png',
    persona: 'Dr. Juan Carlos Pérez López',
    cargo: 'Director Académico'
  },
  {
    url: 'https://i.imgur.com/9KH8yqR.png', // Firma 2
    nombre: 'firma-coordinadora.png',
    persona: 'Lic. María Elena García Ramos',
    cargo: 'Coordinadora de Programas'
  },
  {
    url: 'https://i.imgur.com/7NqzX3M.png', // Firma 3
    nombre: 'firma-jefe.png',
    persona: 'Ing. Carlos Alberto López Martínez',
    cargo: 'Jefe de Capacitación'
  }
];

// Si las URLs de arriba no funcionan, uso placeholders
const firmasPlaceholder = [
  {
    url: 'https://via.placeholder.com/300x100/4A5568/FFFFFF?text=Firma+Director',
    nombre: 'firma-director.png',
    persona: 'Dr. Juan Carlos Pérez López',
    cargo: 'Director Académico'
  },
  {
    url: 'https://via.placeholder.com/300x100/2563EB/FFFFFF?text=Firma+Coordinadora',
    nombre: 'firma-coordinadora.png',
    persona: 'Lic. María Elena García Ramos',
    cargo: 'Coordinadora de Programas'
  },
  {
    url: 'https://via.placeholder.com/300x100/16A34A/FFFFFF?text=Firma+Jefe',
    nombre: 'firma-jefe.png',
    persona: 'Ing. Carlos Alberto López Martínez',
    cargo: 'Jefe de Capacitación'
  }
];

function log(mensaje, color = 'reset') {
  const colores = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(`${colores[color]}${mensaje}${colores.reset}`);
}

/**
 * Descarga una imagen desde una URL
 */
function descargarImagen(url, destino) {
  return new Promise((resolve, reject) => {
    const protocolo = url.startsWith('https') ? https : http;

    const archivo = fs.createWriteStream(destino);

    protocolo.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(archivo);
        archivo.on('finish', () => {
          archivo.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Seguir redirecciones
        descargarImagen(response.headers.location, destino)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Error al descargar: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(destino, () => {});
      reject(err);
    });
  });
}

/**
 * Setup completo: descarga firmas e inserta en BD
 */
async function setup() {
  let connection;

  try {
    log('\n🚀 SETUP DE FIRMAS DE EJEMPLO\n', 'cyan');

    // 1. Crear directorio si no existe
    const dirFirmas = path.join(process.cwd(), 'public', 'uploads', 'firmas');
    if (!fs.existsSync(dirFirmas)) {
      fs.mkdirSync(dirFirmas, { recursive: true });
      log('✅ Directorio creado: public/uploads/firmas/', 'green');
    } else {
      log('✅ Directorio existe: public/uploads/firmas/', 'green');
    }

    // 2. Descargar firmas
    log('\n📥 Descargando firmas de ejemplo...', 'blue');

    let firmasDescargadas = [];
    let usarPlaceholder = false;

    for (const firma of firmasEjemplo) {
      const destino = path.join(dirFirmas, firma.nombre);

      try {
        await descargarImagen(firma.url, destino);
        log(`   ✅ ${firma.nombre} descargada`, 'green');
        firmasDescargadas.push({ ...firma, descargada: true });
      } catch (error) {
        log(`   ⚠️ ${firma.nombre} falló, usando placeholder`, 'yellow');
        usarPlaceholder = true;
      }
    }

    // Si alguna falló, usar placeholders
    if (usarPlaceholder) {
      log('\n📥 Descargando placeholders...', 'blue');
      firmasDescargadas = [];

      for (const firma of firmasPlaceholder) {
        const destino = path.join(dirFirmas, firma.nombre);

        try {
          await descargarImagen(firma.url, destino);
          log(`   ✅ ${firma.nombre} descargada`, 'green');
          firmasDescargadas.push({ ...firma, descargada: true });
        } catch (error) {
          log(`   ❌ Error: ${error.message}`, 'red');
        }
      }
    }

    if (firmasDescargadas.length === 0) {
      throw new Error('No se pudo descargar ninguna firma');
    }

    // 3. Conectar a BD
    log('\n🔌 Conectando a base de datos...', 'blue');
    connection = await mysql.createConnection(dbConfig);
    log('✅ Conexión exitosa', 'green');

    // 4. Verificar si existe la empresa ID 1
    const [empresas] = await connection.query(
      'SELECT id, nombre FROM empresas LIMIT 1'
    );

    if (empresas.length === 0) {
      throw new Error('No hay empresas en la BD. Crea una empresa primero.');
    }

    const empresaId = empresas[0].id;
    const empresaNombre = empresas[0].nombre;

    log(`\n🏢 Usando empresa: [${empresaId}] ${empresaNombre}`, 'cyan');

    // 5. Limpiar firmas anteriores de ejemplo (opcional)
    log('\n🧹 Limpiando firmas anteriores...', 'blue');
    const [deleted] = await connection.query(
      'DELETE FROM firmas_digitales WHERE empresa_id = ?',
      [empresaId]
    );
    log(`   Eliminadas: ${deleted.affectedRows} firma(s)`, 'yellow');

    // 6. Insertar firmas en BD
    log('\n💾 Insertando firmas en base de datos...', 'blue');

    const firmasInsertadas = [];

    for (const firma of firmasDescargadas) {
      const firmaUrl = `/uploads/firmas/${firma.nombre}`;

      const [result] = await connection.query(
        `INSERT INTO firmas_digitales
         (empresa_id, nombre, cargo, firma_url, estado, fecha_creacion, fecha_actualizacion)
         VALUES (?, ?, ?, ?, 'activo', NOW(), NOW())`,
        [empresaId, firma.persona, firma.cargo, firmaUrl]
      );

      firmasInsertadas.push({
        id: result.insertId,
        nombre: firma.persona,
        cargo: firma.cargo,
        url: firmaUrl
      });

      log(`   ✅ ID ${result.insertId}: ${firma.persona}`, 'green');
    }

    // 7. Verificar resultado
    log('\n📊 RESULTADO FINAL:', 'cyan');
    log('─'.repeat(60), 'cyan');

    const [firmas] = await connection.query(
      `SELECT f.*, e.nombre as empresa_nombre
       FROM firmas_digitales f
       JOIN empresas e ON f.empresa_id = e.id
       WHERE f.empresa_id = ?
       ORDER BY f.id`,
      [empresaId]
    );

    console.table(firmas.map(f => ({
      ID: f.id,
      Nombre: f.nombre,
      Cargo: f.cargo,
      Estado: f.estado,
      URL: f.firma_url
    })));

    // 8. Instrucciones de uso
    log('\n✅ ¡SETUP COMPLETO!', 'green');
    log('─'.repeat(60), 'cyan');
    log('\n📖 CÓMO USAR LAS FIRMAS:', 'cyan');
    log('\n1. Ver las firmas en tu navegador:', 'yellow');
    log(`   http://localhost:3002/uploads/firmas/firma-director.png`, 'blue');
    log(`   http://localhost:3002/uploads/firmas/firma-coordinadora.png`, 'blue');
    log(`   http://localhost:3002/uploads/firmas/firma-jefe.png`, 'blue');

    log('\n2. Obtener firmas desde el API:', 'yellow');
    log(`   curl "http://localhost:3002/api/firmas?empresaId=${empresaId}"`, 'blue');

    log('\n3. Generar certificado con firmas (en tu código frontend):', 'yellow');
    log(`   const firmasIds = [${firmasInsertadas.map(f => f.id).join(', ')}];`, 'blue');
    log(`   await CertificadoService.generarLote(`, 'blue');
    log(`     empresaId,`, 'blue');
    log(`     datosExcel,`, 'blue');
    log(`     mapeo,`, 'blue');
    log(`     loteId,`, 'blue');
    log(`     textoEstatico,`, 'blue');
    log(`     firmasIds  // ← PASA LOS IDs AQUÍ`, 'blue');
    log(`   );`, 'blue');

    log('\n4. Gestionar firmas con el CLI:', 'yellow');
    log(`   node scripts/gestionar-firmas.mjs listar ${empresaId}`, 'blue');
    log(`   node scripts/gestionar-firmas.mjs desactivar <id>`, 'blue');
    log(`   node scripts/gestionar-firmas.mjs reactivar <id>`, 'blue');

    log('\n🎉 ¡Listo! Ya puedes generar certificados con firmas.', 'green');
    log('');

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
setup();
