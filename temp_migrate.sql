-- Migrar datos de _nombre_override desde datos_certificado
UPDATE certificados c
LEFT JOIN datos_certificado dc ON dc.certificado_id = c.id AND dc.campo = '_nombre_override'
SET c.nombre_override = dc.valor
WHERE c.nombre_override IS NULL AND dc.valor IS NOT NULL AND dc.valor != '';

-- Ver resumen
SELECT
    COUNT(*) as total_certificados,
    SUM(CASE WHEN nombre_override IS NOT NULL THEN 1 ELSE 0 END) as con_nombre_override,
    SUM(CASE WHEN nombre_override IS NULL THEN 1 ELSE 0 END) as sin_nombre_override
FROM certificados;
