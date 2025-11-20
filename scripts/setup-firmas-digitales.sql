-- ============================================
-- 🚀 SISTEMA DE FIRMAS DIGITALES - VAXA
-- ============================================
-- Fecha: 2025-01-08
-- Propósito: Prevenir falsificación de certificados
--            mediante firmas controladas por administradores
-- ============================================

USE vaxa;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. CREAR TABLA DE FIRMAS DIGITALES
-- ============================================

DROP TABLE IF EXISTS `certificado_firmas`;
DROP TABLE IF EXISTS `firmas_digitales`;

CREATE TABLE `firmas_digitales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empresa_id` INT NOT NULL,
  `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre completo de la persona que firma',
  `cargo` VARCHAR(255) NOT NULL COMMENT 'Cargo/puesto de la persona',
  `firma_url` VARCHAR(500) NOT NULL COMMENT 'Ruta de la imagen de la firma (ej: /uploads/firmas/firma1.png)',
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
COMMENT='Firmas digitales controladas por administradores - Previene falsificación';

-- ============================================
-- 2. CREAR TABLA INTERMEDIA CERTIFICADO_FIRMAS
-- ============================================

CREATE TABLE `certificado_firmas` (
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

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 3. VERIFICACIONES
-- ============================================

SELECT '✅ TABLAS CREADAS CORRECTAMENTE' AS Status;

-- Ver estructura de firmas_digitales
SELECT 'Estructura de firmas_digitales:' AS '';
DESCRIBE firmas_digitales;

-- Ver estructura de certificado_firmas
SELECT '' AS '';
SELECT 'Estructura de certificado_firmas:' AS '';
DESCRIBE certificado_firmas;

-- Contar firmas por empresa
SELECT '' AS '';
SELECT 'Firmas por empresa:' AS '';
SELECT
  e.id,
  e.nombre AS empresa,
  COUNT(f.id) AS total_firmas,
  SUM(CASE WHEN f.estado = 'activo' THEN 1 ELSE 0 END) AS firmas_activas
FROM empresas e
LEFT JOIN firmas_digitales f ON e.id = f.empresa_id
GROUP BY e.id, e.nombre
ORDER BY e.id;

-- ============================================
-- ✅ COMPLETADO
-- ============================================
--
-- PRÓXIMOS PASOS:
-- 1. Crear carpeta: mkdir public/uploads/firmas
-- 2. Subir imágenes de firmas (PNG con fondo transparente)
-- 3. Ejecutar script de gestión: node scripts/gestionar-firmas.mjs
-- 4. Reiniciar servidor: npm run dev
--
-- ============================================
