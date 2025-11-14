# Migraciones de Base de Datos

## Migración: Agregar columna `nombre_override`

### Descripción
Agrega la columna `nombre_override` a la tabla `certificados` para almacenar el nombre personalizado del certificado directamente en la tabla, en lugar de usar la tabla `dato_certificado`.

### Beneficios
- ✅ Acceso más rápido al nombre personalizado
- ✅ Queries más simples (no requiere JOIN con `dato_certificado`)
- ✅ Mejor rendimiento
- ✅ Estructura más clara

### Cómo ejecutar

#### Opción 1: Desde MySQL Workbench o phpMyAdmin
1. Abre el archivo `add_nombre_override_to_certificados.sql`
2. Copia todo el contenido
3. Ejecuta en tu base de datos

#### Opción 2: Desde línea de comandos
```bash
mysql -u tu_usuario -p tu_base_de_datos < migrations/add_nombre_override_to_certificados.sql
```

### ¿Qué hace la migración?

1. **Agrega la columna** `nombre_override` a la tabla `certificados`
2. **Migra los datos existentes** desde `dato_certificado` (donde campo = '_nombre_override')
3. **Muestra un resumen** con estadísticas

### Después de ejecutar

Verás algo como:
```
+--------------------+-------------------------+---------------------------+
| total_certificados | con_nombre_personalizado | sin_nombre_personalizado |
+--------------------+-------------------------+---------------------------+
|               156  |                      12  |                      144  |
+--------------------+-------------------------+---------------------------+
```

### ⚠️ Importante

- **NO elimines** los registros de `_nombre_override` en `dato_certificado` inmediatamente
- Espera unos días para asegurarte de que todo funciona correctamente
- Luego puedes eliminarlos con:
  ```sql
  DELETE FROM dato_certificado WHERE campo = '_nombre_override';
  ```

### Rollback (si necesitas revertir)

```sql
-- Restaurar datos a dato_certificado (opcional)
INSERT INTO dato_certificado (certificado_id, campo, valor, fecha_registro)
SELECT id, '_nombre_override', nombre_override, NOW()
FROM certificados
WHERE nombre_override IS NOT NULL;

-- Eliminar columna
ALTER TABLE certificados DROP COLUMN nombre_override;
```
