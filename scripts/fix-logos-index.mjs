// scripts/fix-logos-index.mjs
// Arregla el problema del índice en la tabla logos_empresa

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixLogosIndex() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vaxa',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    console.log('🔧 Arreglando índice de logos_empresa...\n');

    // 1. Verificar si existe la foreign key
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'logos_empresa'
    `, [process.env.DB_NAME || 'vaxa']);

    console.log('📋 Constraints actuales:');
    console.table(constraints);

    // 2. Buscar la foreign key que usa el índice
    const [foreignKeys] = await connection.query(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'logos_empresa'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME || 'vaxa']);

    console.log('\n🔗 Foreign keys encontradas:');
    console.table(foreignKeys);

    // 3. Verificar índices existentes
    const [indexes] = await connection.query(`
      SHOW INDEXES FROM logos_empresa
    `);

    console.log('\n📊 Índices existentes:');
    console.table(indexes.map(idx => ({
      Key_name: idx.Key_name,
      Column_name: idx.Column_name,
      Non_unique: idx.Non_unique
    })));

    // 4. Si existe el índice problemático, lo eliminamos junto con la FK
    const problematicIndex = indexes.find(idx => idx.Key_name === 'idx_logos_empresa_posicion');

    if (problematicIndex) {
      console.log('\n⚠️  Encontrado índice problemático: idx_logos_empresa_posicion');

      // Buscar la FK que lo usa
      const fkUsingIndex = foreignKeys.find(fk =>
        fk.CONSTRAINT_NAME === 'idx_logos_empresa_posicion' ||
        fk.COLUMN_NAME === 'empresa_id'
      );

      if (fkUsingIndex && fkUsingIndex.CONSTRAINT_NAME !== 'PRIMARY') {
        console.log(`\n🗑️  Eliminando FK: ${fkUsingIndex.CONSTRAINT_NAME}`);
        await connection.query(`
          ALTER TABLE logos_empresa
          DROP FOREIGN KEY \`${fkUsingIndex.CONSTRAINT_NAME}\`
        `);
        console.log('✅ FK eliminada');
      }

      // Ahora eliminar el índice
      console.log('\n🗑️  Eliminando índice: idx_logos_empresa_posicion');
      try {
        await connection.query(`
          ALTER TABLE logos_empresa
          DROP INDEX idx_logos_empresa_posicion
        `);
        console.log('✅ Índice eliminado');
      } catch (error) {
        console.log('⚠️  El índice no se pudo eliminar o no existe:', error.message);
      }

      // Recrear la FK sin el índice problemático
      if (fkUsingIndex && fkUsingIndex.CONSTRAINT_NAME !== 'PRIMARY') {
        console.log('\n🔧 Recreando FK con nombre correcto...');
        await connection.query(`
          ALTER TABLE logos_empresa
          ADD CONSTRAINT FK_logos_empresa_empresa
          FOREIGN KEY (empresa_id)
          REFERENCES empresas(id)
          ON DELETE CASCADE
        `);
        console.log('✅ FK recreada correctamente');
      }
    } else {
      console.log('\n✅ No se encontró el índice problemático');
    }

    // 5. Verificar estado final
    console.log('\n📊 Estado final de la tabla:');
    const [finalIndexes] = await connection.query(`
      SHOW INDEXES FROM logos_empresa
    `);
    console.table(finalIndexes.map(idx => ({
      Key_name: idx.Key_name,
      Column_name: idx.Column_name,
      Non_unique: idx.Non_unique
    })));

    console.log('\n✅ ¡Arreglo completado exitosamente!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixLogosIndex()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
