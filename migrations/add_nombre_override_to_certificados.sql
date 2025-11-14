-- ============================================
-- Migración: Agregar columna nombre_override a certificados
-- Fecha: 2025-01-14
-- Descripción: Agrega columna para almacenar nombre personalizado del certificado
-- ============================================

-- Agregar columna nombre_override
ALTER TABLE certificados
ADD COLUMN nombre_override VARCHAR(255) NULL
COMMENT 'Nombre personalizado para el certificado (sobrescribe el nombre del participante)';

-- Migrar datos existentes de dato_certificado a la nueva columna
UPDATE certificados c
LEFT JOIN dato_certificado dc ON dc.certificado_id = c.id AND dc.campo = '_nombre_override'
SET c.nombre_override = dc.valor
WHERE dc.valor IS NOT NULL AND dc.valor != '';

-- Mostrar resumen
SELECT
    COUNT(*) as total_certificados,
    SUM(CASE WHEN nombre_override IS NOT NULL THEN 1 ELSE 0 END) as con_nombre_personalizado,
    SUM(CASE WHEN nombre_override IS NULL THEN 1 ELSE 0 END) as sin_nombre_personalizado
FROM certificados;
