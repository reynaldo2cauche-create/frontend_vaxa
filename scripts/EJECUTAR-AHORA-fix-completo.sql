-- ============================================
-- 🔧 MIGRACIÓN COMPLETA - FIX CERTIFICADOS CON FIRMAS Y CURSO
-- ============================================
-- Ejecutar: node scripts/ejecutar-migracion-completa.mjs
-- O manualmente en MySQL Workbench
-- ============================================

USE vaxa;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. VERIFICAR Y CREAR TABLA certificado_firmas SI NO EXISTE
-- ============================================

-- Verificar si existe
SET @table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'vaxa'
  AND TABLE_NAME = 'certificado_firmas'
);

-- Crear solo si no existe
CREATE TABLE IF NOT EXISTS `certificado_firmas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `certificado_id` BIGINT NOT NULL,
  `firma_id` INT NOT NULL,
  `orden` INT NOT NULL COMMENT 'Orden de aparición: 1, 2 o 3',
  `fecha_asignacion` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_certificado` (`certificado_id`),
  INDEX `idx_firma` (`firma_id`),
  INDEX `idx_certificado_firma` (`certificado_id`, `firma_id`),
  UNIQUE KEY `unique_certificado_firma` (`certificado_id`, `firma_id`),
  CONSTRAINT `fk_certificado_firmas_certificado`
    FOREIGN KEY (`certificado_id`)
    REFERENCES `certificados` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_certificado_firmas_firma`
    FOREIGN KEY (`firma_id`)
    REFERENCES `firmas_digitales` (`id`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CHECK (`orden` BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relación N:M entre certificados y firmas - Máximo 3 firmas por certificado';

-- ============================================
-- 2. AGREGAR CAMPOS FALTANTES A certificados
-- ============================================

-- Agregar columna curso_nombre (para guardar el nombre del curso del paso 1)
SET @column_exists_curso_nombre = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'vaxa'
  AND TABLE_NAME = 'certificados'
  AND COLUMN_NAME = 'curso_nombre'
);

SET @sql_curso_nombre = IF(
  @column_exists_curso_nombre = 0,
  'ALTER TABLE certificados ADD COLUMN curso_nombre VARCHAR(255) NULL COMMENT ''Nombre del curso del paso 1'' AFTER curso_id',
  'SELECT ''Columna curso_nombre ya existe'' AS msg'
);

PREPARE stmt FROM @sql_curso_nombre;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna horas_curso (para guardar las horas del curso)
SET @column_exists_horas = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'vaxa'
  AND TABLE_NAME = 'certificados'
  AND COLUMN_NAME = 'horas_curso'
);

SET @sql_horas = IF(
  @column_exists_horas = 0,
  'ALTER TABLE certificados ADD COLUMN horas_curso INT NULL COMMENT ''Horas del curso'' AFTER curso_nombre',
  'SELECT ''Columna horas_curso ya existe'' AS msg'
);

PREPARE stmt FROM @sql_horas;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. VERIFICAR TABLA firmas_digitales EXISTE
-- ============================================

SET @firmas_table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'vaxa'
  AND TABLE_NAME = 'firmas_digitales'
);

-- Si no existe, crearla
CREATE TABLE IF NOT EXISTS `firmas_digitales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empresa_id` INT NOT NULL,
  `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre completo de la persona que firma',
  `cargo` VARCHAR(255) NOT NULL COMMENT 'Cargo/puesto de la persona',
  `firma_url` VARCHAR(500) NOT NULL COMMENT 'Ruta de la imagen de la firma',
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_actualizacion` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_empresa` (`empresa_id`),
  INDEX `idx_estado` (`estado`),
  INDEX `idx_empresa_estado` (`empresa_id`, `estado`),
  CONSTRAINT `fk_firmas_digitales_empresa`
    FOREIGN KEY (`empresa_id`)
    REFERENCES `empresas` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Firmas digitales controladas por administradores';

-- ============================================
-- 4. AGREGAR ÍNDICES ÚTILES
-- ============================================

-- Índice en certificados.curso_nombre para búsquedas
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'vaxa'
  AND TABLE_NAME = 'certificados'
  AND INDEX_NAME = 'idx_curso_nombre'
);

SET @sql_index = IF(
  @index_exists = 0,
  'ALTER TABLE certificados ADD INDEX idx_curso_nombre (curso_nombre)',
  'SELECT ''Índice idx_curso_nombre ya existe'' AS msg'
);

PREPARE stmt FROM @sql_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5. VERIFICACIONES FINALES
-- ============================================

SELECT '✅ MIGRACIÓN COMPLETADA' AS Status;
SELECT '' AS '';

-- Verificar estructura de certificados
SELECT 'Estructura de tabla certificados (nuevos campos):' AS '';
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'vaxa'
AND TABLE_NAME = 'certificados'
AND COLUMN_NAME IN ('curso_id', 'curso_nombre', 'horas_curso')
ORDER BY ORDINAL_POSITION;

SELECT '' AS '';

-- Verificar tabla certificado_firmas
SELECT 'Tabla certificado_firmas:' AS '';
SELECT
  TABLE_NAME,
  TABLE_COMMENT,
  (SELECT COUNT(*) FROM certificado_firmas) AS total_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'vaxa'
AND TABLE_NAME = 'certificado_firmas';

SELECT '' AS '';

-- Verificar firmas disponibles
SELECT 'Firmas digitales disponibles:' AS '';
SELECT
  f.id,
  e.nombre AS empresa,
  f.nombre,
  f.cargo,
  f.estado,
  f.firma_url
FROM firmas_digitales f
JOIN empresas e ON f.empresa_id = e.id
ORDER BY f.empresa_id, f.id;

-- ============================================
-- ✅ COMPLETADO
-- ============================================
--
-- CAMBIOS REALIZADOS:
-- 1. ✅ Tabla certificado_firmas creada (relación N:M)
-- 2. ✅ Campo curso_nombre agregado a certificados
-- 3. ✅ Campo horas_curso agregado a certificados
-- 4. ✅ Tabla firmas_digitales verificada/creada
-- 5. ✅ Índices optimizados
--
-- PRÓXIMOS PASOS:
-- 1. Actualizar entidades TypeORM (CertificadoFirma.ts)
-- 2. Modificar API de generación (/api/generar-certificados)
-- 3. Actualizar frontend para enviar curso_nombre y firmas_ids
-- 4. Modificar PDFService para usar firmas de BD
--
-- ============================================
