// ============================================
// Script para ejecutar migración SQL
// ============================================
import 'reflect-metadata';
import { AppDataSource } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const sqlPath = path.join(__dirname, 'migration_final.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔄 Ejecutando migración SQL...');

    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await AppDataSource.query(statement);
      } catch (error: any) {
        // Ignorar errores de "ya existe"
        if (!error.message.includes('already exists') &&
            !error.message.includes('Duplicate') &&
            !error.message.includes('ya existe')) {
          console.error('❌ Error en statement:', statement.substring(0, 100));
          console.error(error.message);
        }
      }
    }

    console.log('✅ Migración completada');

    // Verificar tablas creadas
    const result: any = await AppDataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'vaxa'
      AND table_name IN ('participantes', 'cursos')
    `);

    console.log('\n📊 Tablas verificadas:');
    result.forEach((row: any) => {
      console.log(`  ✓ ${row.TABLE_NAME || row.table_name}`);
    });

    await AppDataSource.destroy();
    console.log('\n🎉 Todo listo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runMigration();
