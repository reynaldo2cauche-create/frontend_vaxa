# ✅ Checklist: Pasos para Completar la Implementación

## 🎯 PASO 1: Ejecutar Scripts SQL (OBLIGATORIO)

### ⏱️ Tiempo estimado: 5 minutos

Abre tu gestor de base de datos (MySQL Workbench, phpMyAdmin, etc.) y ejecuta en orden:

```bash
# Ubicación de los scripts:
C:\Users\Lucero\Desktop\frontend_vaxa\scripts\
```

### 1.1. Crear Tablas de Firmas

```sql
-- Archivo: crear-tablas-firmas.sql
-- Crea: firmas_digitales y certificado_firmas

USE vaxa;

-- Ejecutar todo el contenido del archivo:
scripts/crear-tablas-firmas.sql
```

**✅ Verificación:**
```sql
-- Deberías ver las tablas creadas:
SHOW TABLES LIKE 'firmas%';
SHOW TABLES LIKE 'certificado_firmas';

-- O mejor aún, ejecutar script de verificación completo:
SOURCE scripts/verificar-instalacion.sql;

-- Verificar estructura individual:
DESCRIBE firmas_digitales;
DESCRIBE certificado_firmas;
```

### 1.2. Actualizar Tabla Lotes

```sql
-- Archivo: actualizar-tabla-lotes.sql
-- Agrega campos: tipo_documento y curso

USE vaxa;

-- Ejecutar todo el contenido del archivo:
scripts/actualizar-tabla-lotes.sql
```

**✅ Verificación:**
```sql
-- Debería mostrar las nuevas columnas:
DESCRIBE lotes;

-- Buscar: tipo_documento y curso
```

---

## 🎯 PASO 2: Agregar Firmas Digitales (OBLIGATORIO)

### ⏱️ Tiempo estimado: 10-15 minutos

### 2.1. Preparar Imágenes de Firmas

**Especificaciones:**
- Formato: PNG con fondo transparente
- Tamaño: 300x100 px (aproximadamente)
- Peso: Máximo 500 KB por imagen
- Calidad: Alta resolución

**Ubicación:**
```bash
# Crear carpeta si no existe:
mkdir public/uploads/firmas

# Copiar imágenes:
public/
  uploads/
    firmas/
      ✅ firma-juan-perez.png
      ✅ firma-maria-garcia.png
      ✅ firma-carlos-lopez.png
```

### 2.2. Insertar Firmas en Base de Datos

**Opción A: Usando CLI (Recomendado)**

```bash
# Comando base:
node scripts/gestionar-firmas.mjs insertar [empresaId] [nombre] [cargo] [url]

# Ejemplos:
node scripts/gestionar-firmas.mjs insertar 1 "Dr. Juan Pérez López" "Director Académico" "/uploads/firmas/firma-juan-perez.png"

node scripts/gestionar-firmas.mjs insertar 1 "Lic. María García Rodríguez" "Coordinadora de Capacitaciones" "/uploads/firmas/firma-maria-garcia.png"

node scripts/gestionar-firmas.mjs insertar 1 "Ing. Carlos López Sánchez" "Gerente General" "/uploads/firmas/firma-carlos-lopez.png"
```

**Opción B: Usando SQL Directo**

```sql
-- Reemplaza empresa_id = 1 con tu ID de empresa
INSERT INTO firmas_digitales (empresa_id, nombre, cargo, firma_url, estado)
VALUES
  (1, 'Dr. Juan Pérez López', 'Director Académico', '/uploads/firmas/firma-juan-perez.png', 'activo'),
  (1, 'Lic. María García Rodríguez', 'Coordinadora de Capacitaciones', '/uploads/firmas/firma-maria-garcia.png', 'activo'),
  (1, 'Ing. Carlos López Sánchez', 'Gerente General', '/uploads/firmas/firma-carlos-lopez.png', 'activo');
```

**✅ Verificación:**
```bash
# Listar firmas insertadas:
node scripts/gestionar-firmas.mjs listar 1

# O usando SQL:
SELECT * FROM firmas_digitales WHERE empresa_id = 1;
```

---

## 🎯 PASO 3: Probar el Backend (OBLIGATORIO)

### ⏱️ Tiempo estimado: 5 minutos

### 3.1. Reiniciar Servidor

```bash
# Detener servidor (Ctrl+C)
# Reiniciar:
npm run dev
```

### 3.2. Probar API de Firmas

**En el navegador:**
```
http://localhost:3000/api/firmas-digitales?empresaId=1
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Dr. Juan Pérez López",
      "cargo": "Director Académico",
      "firma_url": "/uploads/firmas/firma-juan-perez.png",
      "fecha_creacion": "2025-01-08T..."
    },
    ...
  ]
}
```

**✅ Si ves esto, ¡el backend está funcionando perfectamente!** 🎉

---

## 🎯 PASO 4: Integración Frontend (PENDIENTE)

### ⏱️ Tiempo estimado: 2-3 horas

Este paso requiere actualizar el componente `subirExcel.tsx`.

### 4.1. Agregar Campos en Paso 1

Modificar `src/app/[slug]/dashboard/subirExcel.tsx`:

```tsx
// Agregar estados:
const [tipoDocumento, setTipoDocumento] = useState('');
const [curso, setCurso] = useState('');

// Agregar en el Paso 1 (antes de subir Excel):
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Tipo de Documento *
  </label>
  <input
    type="text"
    value={tipoDocumento}
    onChange={(e) => setTipoDocumento(e.target.value)}
    placeholder="Ej: DNI, CE, RUC, Pasaporte"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>

<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Curso *
  </label>
  <input
    type="text"
    value={curso}
    onChange={(e) => setCurso(e.target.value)}
    placeholder="Nombre del curso, taller o programa"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

### 4.2. Agregar Paso de Selección de Firmas

```tsx
import SeleccionarFirmas from './SeleccionarFirmas';

// Agregar estado:
const [firmasSeleccionadas, setFirmasSeleccionadas] = useState([]);

// Agregar nuevo paso (paso 5):
{paso === 5 && (
  <SeleccionarFirmas
    empresaId={empresaId}
    onFirmasSeleccionadas={setFirmasSeleccionadas}
  />
)}
```

### 4.3. Enviar Datos al API

```tsx
const formData = new FormData();
formData.append('file', archivo!);
formData.append('empresaId', empresaId.toString());
formData.append('mapeo', JSON.stringify(mapeo));
formData.append('tipoDocumento', tipoDocumento);  // ✅ NUEVO
formData.append('curso', curso);  // ✅ NUEVO
formData.append('firmas', JSON.stringify(firmasSeleccionadas));  // ✅ NUEVO
```

---

## 🎯 PASO 5: Actualizar Plantilla Excel (PENDIENTE)

### ⏱️ Tiempo estimado: 30 minutos

### 5.1. Columnas a ELIMINAR:
- ❌ Tipo de Documento (ahora se configura por lote)
- ❌ Curso (ahora se configura por lote)
- ❌ Ponente (reemplazado por firmas digitales)

### 5.2. Columnas que PERMANECEN:
- ✅ Término
- ✅ Nombres
- ✅ Apellidos
- ✅ DNI
- ✅ Correo Electrónico
- ✅ Fecha de Emisión
- ✅ Horas Académicas
- ✅ Fecha de Inicio
- ✅ Fecha de Fin

### 5.3. Actualizar Archivo Descargable

Ubicación del archivo de plantilla:
```bash
public/plantillas/plantilla-certificados.xlsx
```

**Acción requerida:**
1. Abrir Excel
2. Eliminar columnas obsoletas
3. Guardar nueva versión
4. Actualizar link de descarga en frontend

---

## 🎯 PASO 6: Validación de Dimensiones (OPCIONAL)

### ⏱️ Tiempo estimado: 1 hora

Agregar validación al subir plantilla de certificado:

```tsx
const validarDimensiones = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      // Dimensiones mínimas: 1754 x 2480 px (210 DPI)
      if (width < 1754 || height < 2480) {
        alert('La imagen debe tener un tamaño mínimo de 1754 x 2480 píxeles');
        resolve(false);
      } else {
        resolve(true);
      }
    };
    img.src = URL.createObjectURL(file);
  });
};
```

---

## 🎯 PASO 7: Testing Completo (OBLIGATORIO)

### ⏱️ Tiempo estimado: 30 minutos

### 7.1. Test de Firmas

```bash
# 1. Listar firmas
node scripts/gestionar-firmas.mjs listar 1

# 2. Verificar API
curl http://localhost:3000/api/firmas-digitales?empresaId=1

# 3. Probar en navegador
# Abrir: http://localhost:3000/tu-empresa/dashboard
```

### 7.2. Test de Generación de Certificados

1. ✅ Subir Excel con datos
2. ✅ Ingresar tipo de documento y curso
3. ✅ Seleccionar 1-3 firmas
4. ✅ Generar certificados
5. ✅ Verificar que se guardaron firmas en BD:

```sql
SELECT
  c.codigo,
  f.nombre,
  f.cargo,
  cf.orden
FROM certificado_firmas cf
JOIN certificados c ON cf.certificado_id = c.id
JOIN firmas_digitales f ON cf.firma_id = f.id
ORDER BY c.codigo, cf.orden;
```

---

## 📊 Progreso Actual

| Tarea | Estado | Progreso |
|-------|--------|----------|
| PASO 1: Scripts SQL | ⏳ Pendiente | 0% |
| PASO 2: Agregar Firmas | ⏳ Pendiente | 0% |
| PASO 3: Probar Backend | ⏳ Pendiente | 0% |
| PASO 4: Integración Frontend | ⏳ Pendiente | 0% |
| PASO 5: Plantilla Excel | ⏳ Pendiente | 0% |
| PASO 6: Validación Dimensiones | ⏳ Opcional | 0% |
| PASO 7: Testing | ⏳ Pendiente | 0% |

---

## 🚨 Errores Comunes y Soluciones

### Error: "Table already exists"
**Causa:** Ya ejecutaste el script antes
**Solución:** Omitir ese script o usar `DROP TABLE IF EXISTS` antes

### Error: "Cannot find module mysql2"
**Causa:** Dependencia no instalada
**Solución:**
```bash
npm install mysql2
```

### Error: "Firma no encontrada"
**Causa:** ID de firma incorrecto o firma desactivada
**Solución:**
```sql
-- Ver firmas disponibles:
SELECT * FROM firmas_digitales WHERE estado = 'activo';

-- Reactivar firma:
UPDATE firmas_digitales SET estado = 'activo' WHERE id = X;
```

### Error: "ENOENT: no such file or directory"
**Causa:** Imagen de firma no existe en la ruta especificada
**Solución:**
```bash
# Verificar que existe:
ls public/uploads/firmas/

# Copiar imagen:
cp /ruta/origen/firma.png public/uploads/firmas/
```

---

## 🎓 Recursos Adicionales

### Documentación:
- 📖 `IMPLEMENTACION-FIRMAS-DIGITALES.md` - Documentación técnica completa
- 📊 `RESUMEN-EJECUTIVO-FIRMAS.md` - Resumen ejecutivo del proyecto
- ✅ `PASOS-PARA-COMPLETAR.md` - Este archivo

### Scripts:
- 🔧 `scripts/crear-tablas-firmas.sql`
- 🔧 `scripts/actualizar-tabla-lotes.sql`
- 🔧 `scripts/insert-firmas-ejemplo.sql`
- 🔧 `scripts/gestionar-firmas.mjs`

### Comandos Útiles:

```bash
# Gestión de firmas
node scripts/gestionar-firmas.mjs help

# Ver logs del servidor
npm run dev

# Verificar puerto
netstat -ano | findstr :3000

# Limpiar cache
npm run build
```

---

## ✅ Checklist Final

Marca cada ítem cuando lo completes:

- [ ] Scripts SQL ejecutados
- [ ] Tablas creadas correctamente
- [ ] Al menos 3 firmas agregadas
- [ ] API de firmas funcionando
- [ ] Backend probado
- [ ] Frontend integrado
- [ ] Plantilla Excel actualizada
- [ ] Testing completo realizado
- [ ] Documentación leída
- [ ] Sistema funcionando end-to-end

---

**¡Una vez completados todos los pasos, el sistema estará 100% funcional!** 🎉

**Última actualización:** 2025-01-08
**Próxima revisión:** Después de completar Paso 3
