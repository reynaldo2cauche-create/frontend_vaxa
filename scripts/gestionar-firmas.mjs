// scripts/gestionar-firmas.mjs
// CLI para gestionar firmas digitales
// Uso: node scripts/gestionar-firmas.mjs [comando] [args...]

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
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

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  log('\n📝 GESTOR DE FIRMAS DIGITALES - VAXA\n', 'bright');
  log('Comandos disponibles:', 'cyan');
  log('');
  log('  help                                    Muestra esta ayuda', 'yellow');
  log('  listar [empresaId]                      Lista todas las firmas (opcionalmente filtradas por empresa)', 'yellow');
  log('  insertar <empresaId> <nombre> <cargo> <ruta>  Inserta una nueva firma', 'yellow');
  log('  actualizar <firmaId> <campo> <valor>    Actualiza un campo de la firma', 'yellow');
  log('  desactivar <firmaId>                    Desactiva una firma (soft delete)', 'yellow');
  log('  reactivar <firmaId>                     Reactiva una firma', 'yellow');
  log('  eliminar <firmaId>                      Elimina permanentemente una firma', 'yellow');
  log('  stats                                   Muestra estadísticas generales', 'yellow');
  log('  verificar <ruta>                        Verifica que una imagen existe', 'yellow');
  log('');
  log('Ejemplos:', 'cyan');
  log('  node scripts/gestionar-firmas.mjs listar 1');
  log('  node scripts/gestionar-firmas.mjs insertar 1 "Dr. Juan Pérez" "Director" "/uploads/firmas/juan.png"');
  log('  node scripts/gestionar-firmas.mjs desactivar 5');
  log('  node scripts/gestionar-firmas.mjs stats');
  log('');
}

async function listarFirmas(empresaId = null) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    let query = `
      SELECT
        f.id,
        f.empresa_id,
        e.nombre AS empresa,
        f.nombre,
        f.cargo,
        f.firma_url,
        f.estado,
        f.fecha_creacion,
        COUNT(cf.id) AS usos
      FROM firmas_digitales f
      INNER JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN certificado_firmas cf ON f.id = cf.firma_id
    `;

    const params = [];
    if (empresaId) {
      query += ' WHERE f.empresa_id = ?';
      params.push(empresaId);
    }

    query += ' GROUP BY f.id ORDER BY f.empresa_id, f.id';

    const [rows] = await connection.query(query, params);

    if (rows.length === 0) {
      log('\n⚠️  No se encontraron firmas', 'yellow');
      return;
    }

    log(`\n📋 Firmas encontradas: ${rows.length}\n`, 'green');
    console.table(rows.map(r => ({
      ID: r.id,
      Empresa: `[${r.empresa_id}] ${r.empresa}`,
      Nombre: r.nombre,
      Cargo: r.cargo,
      URL: r.firma_url,
      Estado: r.estado,
      Usos: r.usos
    })));

  } finally {
    await connection.end();
  }
}

async function insertarFirma(empresaId, nombre, cargo, firmaUrl) {
  if (!empresaId || !nombre || !cargo || !firmaUrl) {
    log('\n❌ Error: Faltan parámetros', 'red');
    log('Uso: insertar <empresaId> <nombre> <cargo> <ruta>', 'yellow');
    return;
  }

  // Verificar que la ruta de la imagen existe
  const rutaCompleta = path.join(process.cwd(), 'public', firmaUrl);
  if (!fs.existsSync(rutaCompleta)) {
    log(`\n⚠️  Advertencia: El archivo no existe en: ${rutaCompleta}`, 'yellow');
    log('La firma se insertará igualmente, pero asegúrate de copiar el archivo.', 'yellow');
  } else {
    log(`\n✅ Archivo encontrado: ${rutaCompleta}`, 'green');
  }

  const connection = await mysql.createConnection(dbConfig);

  try {
    // Verificar que la empresa existe
    const [empresas] = await connection.query(
      'SELECT id, nombre FROM empresas WHERE id = ?',
      [empresaId]
    );

    if (empresas.length === 0) {
      log(`\n❌ Error: La empresa ${empresaId} no existe`, 'red');
      return;
    }

    // Insertar firma
    const [result] = await connection.query(
      `INSERT INTO firmas_digitales
       (empresa_id, nombre, cargo, firma_url, estado, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, 'activo', NOW(), NOW())`,
      [empresaId, nombre, cargo, firmaUrl]
    );

    log(`\n✅ Firma insertada exitosamente`, 'green');
    log(`   ID: ${result.insertId}`, 'cyan');
    log(`   Empresa: [${empresaId}] ${empresas[0].nombre}`, 'cyan');
    log(`   Nombre: ${nombre}`, 'cyan');
    log(`   Cargo: ${cargo}`, 'cyan');
    log(`   URL: ${firmaUrl}`, 'cyan');

  } finally {
    await connection.end();
  }
}

async function actualizarFirma(firmaId, campo, valor) {
  if (!firmaId || !campo || !valor) {
    log('\n❌ Error: Faltan parámetros', 'red');
    log('Uso: actualizar <firmaId> <campo> <valor>', 'yellow');
    log('Campos permitidos: nombre, cargo, firma_url', 'yellow');
    return;
  }

  const camposPermitidos = ['nombre', 'cargo', 'firma_url'];
  if (!camposPermitidos.includes(campo)) {
    log(`\n❌ Error: Campo '${campo}' no permitido`, 'red');
    log(`Campos permitidos: ${camposPermitidos.join(', ')}`, 'yellow');
    return;
  }

  const connection = await mysql.createConnection(dbConfig);

  try {
    const [result] = await connection.query(
      `UPDATE firmas_digitales SET ${campo} = ?, fecha_actualizacion = NOW() WHERE id = ?`,
      [valor, firmaId]
    );

    if (result.affectedRows === 0) {
      log(`\n❌ Error: Firma ${firmaId} no encontrada`, 'red');
      return;
    }

    log(`\n✅ Firma ${firmaId} actualizada`, 'green');
    log(`   ${campo} = ${valor}`, 'cyan');

  } finally {
    await connection.end();
  }
}

async function desactivarFirma(firmaId) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [result] = await connection.query(
      `UPDATE firmas_digitales SET estado = 'inactivo', fecha_actualizacion = NOW() WHERE id = ?`,
      [firmaId]
    );

    if (result.affectedRows === 0) {
      log(`\n❌ Error: Firma ${firmaId} no encontrada`, 'red');
      return;
    }

    log(`\n✅ Firma ${firmaId} desactivada`, 'green');

  } finally {
    await connection.end();
  }
}

async function reactivarFirma(firmaId) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [result] = await connection.query(
      `UPDATE firmas_digitales SET estado = 'activo', fecha_actualizacion = NOW() WHERE id = ?`,
      [firmaId]
    );

    if (result.affectedRows === 0) {
      log(`\n❌ Error: Firma ${firmaId} no encontrada`, 'red');
      return;
    }

    log(`\n✅ Firma ${firmaId} reactivada`, 'green');

  } finally {
    await connection.end();
  }
}

async function eliminarFirma(firmaId) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Verificar si tiene certificados asociados
    const [usos] = await connection.query(
      'SELECT COUNT(*) as total FROM certificado_firmas WHERE firma_id = ?',
      [firmaId]
    );

    if (usos[0].total > 0) {
      log(`\n⚠️  Advertencia: Esta firma tiene ${usos[0].total} certificado(s) asociado(s)`, 'yellow');
      log('No se puede eliminar. Usa "desactivar" en su lugar.', 'yellow');
      return;
    }

    const [result] = await connection.query(
      'DELETE FROM firmas_digitales WHERE id = ?',
      [firmaId]
    );

    if (result.affectedRows === 0) {
      log(`\n❌ Error: Firma ${firmaId} no encontrada`, 'red');
      return;
    }

    log(`\n✅ Firma ${firmaId} eliminada permanentemente`, 'green');

  } finally {
    await connection.end();
  }
}

async function mostrarEstadisticas() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Estadísticas generales
    const [stats] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM firmas_digitales) as total_firmas,
        (SELECT COUNT(*) FROM firmas_digitales WHERE estado = 'activo') as firmas_activas,
        (SELECT COUNT(*) FROM firmas_digitales WHERE estado = 'inactivo') as firmas_inactivas,
        (SELECT COUNT(DISTINCT empresa_id) FROM firmas_digitales) as empresas_con_firmas,
        (SELECT COUNT(*) FROM certificado_firmas) as total_usos
    `);

    // Firmas por empresa
    const [porEmpresa] = await connection.query(`
      SELECT
        e.id,
        e.nombre AS empresa,
        COUNT(f.id) as total_firmas,
        SUM(CASE WHEN f.estado = 'activo' THEN 1 ELSE 0 END) as activas
      FROM empresas e
      LEFT JOIN firmas_digitales f ON e.id = f.empresa_id
      GROUP BY e.id, e.nombre
      HAVING total_firmas > 0
      ORDER BY total_firmas DESC
    `);

    // Top firmas más usadas
    const [topFirmas] = await connection.query(`
      SELECT
        f.id,
        f.nombre,
        f.cargo,
        e.nombre AS empresa,
        COUNT(cf.id) as usos
      FROM firmas_digitales f
      INNER JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN certificado_firmas cf ON f.id = cf.firma_id
      GROUP BY f.id
      HAVING usos > 0
      ORDER BY usos DESC
      LIMIT 10
    `);

    log('\n📊 ESTADÍSTICAS DE FIRMAS\n', 'bright');

    log('Resumen General:', 'cyan');
    console.table([{
      'Total Firmas': stats[0].total_firmas,
      'Activas': stats[0].firmas_activas,
      'Inactivas': stats[0].firmas_inactivas,
      'Empresas': stats[0].empresas_con_firmas,
      'Usos Totales': stats[0].total_usos
    }]);

    if (porEmpresa.length > 0) {
      log('\nFirmas por Empresa:', 'cyan');
      console.table(porEmpresa.map(e => ({
        ID: e.id,
        Empresa: e.empresa,
        Total: e.total_firmas,
        Activas: e.activas
      })));
    }

    if (topFirmas.length > 0) {
      log('\nTop Firmas Más Usadas:', 'cyan');
      console.table(topFirmas.map(f => ({
        ID: f.id,
        Nombre: f.nombre,
        Cargo: f.cargo,
        Empresa: f.empresa,
        Usos: f.usos
      })));
    }

  } finally {
    await connection.end();
  }
}

async function verificarArchivo(ruta) {
  const rutaCompleta = path.join(process.cwd(), 'public', ruta);

  log(`\n🔍 Verificando archivo...`, 'cyan');
  log(`Ruta relativa: ${ruta}`, 'cyan');
  log(`Ruta absoluta: ${rutaCompleta}`, 'cyan');

  if (fs.existsSync(rutaCompleta)) {
    const stats = fs.statSync(rutaCompleta);
    log(`\n✅ Archivo encontrado`, 'green');
    log(`Tamaño: ${(stats.size / 1024).toFixed(2)} KB`, 'cyan');
    log(`Última modificación: ${stats.mtime.toLocaleString()}`, 'cyan');
  } else {
    log(`\n❌ Archivo NO encontrado`, 'red');
    log(`Asegúrate de copiar el archivo a: ${rutaCompleta}`, 'yellow');
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const comando = args[0];

  try {
    switch (comando) {
      case 'help':
      case undefined:
        showHelp();
        break;

      case 'listar':
        await listarFirmas(args[1] ? parseInt(args[1]) : null);
        break;

      case 'insertar':
        await insertarFirma(
          parseInt(args[1]),
          args[2],
          args[3],
          args[4]
        );
        break;

      case 'actualizar':
        await actualizarFirma(
          parseInt(args[1]),
          args[2],
          args[3]
        );
        break;

      case 'desactivar':
        await desactivarFirma(parseInt(args[1]));
        break;

      case 'reactivar':
        await reactivarFirma(parseInt(args[1]));
        break;

      case 'eliminar':
        await eliminarFirma(parseInt(args[1]));
        break;

      case 'stats':
        await mostrarEstadisticas();
        break;

      case 'verificar':
        await verificarArchivo(args[1]);
        break;

      default:
        log(`\n❌ Comando desconocido: ${comando}`, 'red');
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
