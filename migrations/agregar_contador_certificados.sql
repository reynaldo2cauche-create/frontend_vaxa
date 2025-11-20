-- ============================================
-- Migración: Agregar sistema de contador de certificados
-- Fecha: 2025-01-13
-- Descripción: Agrega campos para controlar plan de 100 certificados
-- ============================================

-- Agregar campos a la tabla empresas
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS certificados_emitidos INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS limite_plan INT DEFAULT 100;

-- Actualizar empresas existentes con contador actual
-- Esto cuenta cuántos certificados ya han generado
UPDATE empresas e
SET certificados_emitidos = (
    SELECT COUNT(*)
    FROM certificados c
    WHERE c.empresa_id = e.id
);

-- Crear índice para optimizar consultas de contador
CREATE INDEX IF NOT EXISTS idx_empresas_certificados ON empresas(certificados_emitidos);

-- Comentarios
COMMENT ON COLUMN empresas.certificados_emitidos IS 'Contador de certificados únicos generados (no incluye regeneraciones)';
COMMENT ON COLUMN empresas.limite_plan IS 'Límite del plan contratado (default: 100)';

-- ============================================
-- Notas:
-- - certificados_emitidos: Se incrementa SOLO al generar nuevos códigos
-- - limite_plan: Se puede ajustar según el plan contratado por el cliente
-- - Regeneraciones NO cuentan (mismo código único)
-- ============================================
