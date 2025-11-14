-- Inicializar nombre_override con el nombre del participante para todos los certificados que no lo tienen
UPDATE certificados c
INNER JOIN participantes p ON p.id = c.participante_id
SET c.nombre_override = CONCAT_WS(' ', p.nombres, p.apellidos)
WHERE c.nombre_override IS NULL OR c.nombre_override = '';

-- Ver resumen
SELECT
    COUNT(*) as total_certificados,
    SUM(CASE WHEN nombre_override IS NOT NULL AND nombre_override != '' THEN 1 ELSE 0 END) as con_nombre_override,
    SUM(CASE WHEN nombre_override IS NULL OR nombre_override = '' THEN 1 ELSE 0 END) as sin_nombre_override
FROM certificados;
