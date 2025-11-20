// Script para migrar textos de certificados existentes
// Agrega campos _titulo y _cuerpo a certificados que no los tienen

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'vaxa'
});

console.log('🔄 Iniciando migración de textos de certificados...\n');

try {
  // 1. Obtener todas las empresas
  const [empresas] = await connection.execute(`
    SELECT id, nombre
    FROM empresas
  `);

  console.log(`📊 Encontradas ${empresas.length} empresa(s)\n`);

  for (const empresa of empresas) {
    console.log(`\n🏢 Procesando empresa: ${empresa.nombre} (ID: ${empresa.id})`);

    // 2. Obtener la configuración de texto de la empresa
    const [plantillaTexto] = await connection.execute(`
      SELECT pt.titulo, pt.cuerpo
      FROM plantillas_config pc
      JOIN plantillas_texto pt ON pc.plantilla_texto_id = pt.id
      WHERE pc.empresa_id = ?
      LIMIT 1
    `, [empresa.id]);

    let titulo = 'CERTIFICADO DE PARTICIPACIÓN';
    let cuerpo = 'Por haber completado exitosamente';

    if (plantillaTexto.length > 0) {
      titulo = plantillaTexto[0].titulo || titulo;
      cuerpo = plantillaTexto[0].cuerpo || cuerpo;
      console.log(`   ✅ Configuración de texto encontrada para la empresa`);
    } else {
      console.log(`   ⚠️  No hay configuración de texto, usando valores por defecto`);
    }

    // 3. Obtener todos los certificados de esta empresa que NO tienen _titulo y _cuerpo
    const [certificados] = await connection.execute(`
      SELECT c.id, c.codigo
      FROM certificados c
      WHERE c.empresa_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM datos_certificado dc
        WHERE dc.certificado_id = c.id AND dc.campo = '_titulo'
      )
    `, [empresa.id]);

    if (certificados.length === 0) {
      console.log(`   ✅ Todos los certificados ya tienen textos guardados`);
      continue;
    }

    console.log(`   📋 Encontrados ${certificados.length} certificado(s) sin textos guardados`);
    console.log(`   🔄 Agregando textos...`);

    // 4. Insertar _titulo y _cuerpo para cada certificado
    let procesados = 0;
    for (const cert of certificados) {
      await connection.execute(`
        INSERT INTO datos_certificado (certificado_id, campo, valor)
        VALUES (?, '_titulo', ?), (?, '_cuerpo', ?)
      `, [cert.id, titulo, cert.id, cuerpo]);

      procesados++;

      if (procesados % 50 === 0) {
        console.log(`   ⏳ Procesados ${procesados}/${certificados.length}...`);
      }
    }

    console.log(`   ✅ Migración completada: ${procesados} certificado(s) actualizados`);
  }

  console.log('\n\n✅ ¡Migración completada exitosamente!');
  console.log('   Ahora todos los certificados tienen guardado su título y cuerpo.');
  console.log('   Al regenerar certificados, mantendrán el texto correcto.\n');

} catch (error) {
  console.error('❌ Error durante la migración:', error);
  throw error;
} finally {
  await connection.end();
}
