# ✅ CAMBIOS COMPLETADOS - FIRMAS Y CURSO EN CERTIFICADOS

## 📋 Resumen
Se han implementado todos los cambios necesarios para que:
1. Las firmas se carguen dinámicamente desde la base de datos
2. El curso del paso 1 se guarde en la base de datos y aparezca en los PDF
3. Las relaciones entre certificados y firmas estén correctamente establecidas

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Nueva Tabla: `certificado_firmas`
Tabla intermedia para relacionar certificados con firmas (relación N:M)

```sql
CREATE TABLE `certificado_firmas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `certificado_id` BIGINT NOT NULL,
  `firma_id` INT NOT NULL,
  `orden` INT NOT NULL,
  `fecha_asignacion` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`certificado_id`) REFERENCES `certificados` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`firma_id`) REFERENCES `firmas_digitales` (`id`) ON DELETE RESTRICT
)
```

### 2. Nuevos Campos en `certificados`
- `curso_nombre` VARCHAR(255) - Guarda el nombre del curso del paso 1
- `horas_curso` INT - Guarda las horas del curso

### 3. Datos de Ejemplo
Se crearon 3 firmas de ejemplo para empresa ID=2:
- **ID 4**: Dr. Juan Carlos Pérez López (Director Académico)
- **ID 5**: Lic. María Elena García Ramos (Coordinadora de Programas)
- **ID 6**: Ing. Carlos Alberto López Martínez (Jefe de Capacitación)

**Archivos:** `public/uploads/firmas/*.png`

---

## 🔧 CAMBIOS EN CÓDIGO

### 1. Entidades TypeORM

#### **Nueva Entidad: `CertificadoFirma.ts`**
```typescript
src/lib/entities/CertificadoFirma.ts
```
Maneja la relación N:M entre certificados y firmas.

#### **Actualizada: `Certificado.ts`**
Agregados nuevos campos:
```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
curso_nombre: string | null;

@Column({ type: 'int', nullable: true })
horas_curso: number | null;
```

### 2. APIs Modificadas

#### **`/api/firmas/route.ts` (línea 41)**
**Cambio:** Corregido el mapeo de respuesta
```typescript
// ANTES
firma_url: f.firmaUrl

// DESPUÉS
firmaUrl: f.firmaUrl
```

#### **`/api/generar-certificados/route.ts`**
Ya recibía correctamente:
- `curso` (del paso 1)
- `firmasIds` (array de IDs de firmas seleccionadas)

### 3. Servicios

#### **`CertificadoService.ts` (línea 487-493)**
Ahora guarda curso_nombre y horas_curso:
```typescript
const certificado = certificadoRepo.create({
  codigo: certGenerado.codigo,
  empresa_id: empresaId,
  participante_id: participanteId,
  curso_id: cursoId,
  curso_nombre: datosMapeados['curso'] || null,  // ✅ NUEVO
  horas_curso: datosMapeados['horas'] ? parseInt(datosMapeados['horas']) : null,  // ✅ NUEVO
  lote_id: loteId,
  archivo_url: certGenerado.rutaArchivo,
  estado: EstadoCertificado.ACTIVO,
  fecha_emision: new Date()
});
```

#### **Relación certificado-firma (línea 503-514)**
Guarda las firmas seleccionadas:
```typescript
if (firmasIds && firmasIds.length > 0) {
  for (let orden = 0; orden < firmasIds.length; orden++) {
    const certificadoFirma = certificadoFirmaRepo.create({
      certificadoId: certificado.id,
      firmaId: firmasIds[orden],
      orden: orden + 1,
      fechaAsignacion: new Date()
    });
    await certificadoFirmaRepo.save(certificadoFirma);
  }
}
```

### 4. Frontend

#### **`SelectorFirmas.tsx` - CAMBIOS MAYORES**

**ANTES (línea 20-51):**
```typescript
// Firmas ficticias hardcodeadas
const FIRMAS_DISPONIBLES: Firma[] = [
  { id: 1, nombre: 'Dr. Carlos Mendoza', ... },
  ...
];
```

**DESPUÉS (línea 27-53):**
```typescript
// Carga firmas desde el API
useEffect(() => {
  const cargarFirmas = async () => {
    const response = await fetch(`/api/firmas?empresaId=${empresaId}`);
    const data = await response.json();

    if (data.success && data.data) {
      setFirmasDisponibles(data.data);
    }
  };

  cargarFirmas();
}, [empresaId]);
```

**Cambios adicionales:**
- Estado de carga (`cargando`)
- Muestra imágenes reales de firmas con `<Image>`
- Fallback si no hay firmas disponibles
- Props actualizada para recibir `empresaId`

#### **`page.tsx` (línea 777)**
Ahora pasa `empresaId` al componente:
```typescript
<SelectorFirmas
  empresaId={empresa.id}  // ✅ NUEVO
  onFirmasSeleccionadas={...}
  firmasInicial={firmas}
/>
```

---

## 🧪 CÓMO PROBAR

### 1. Verificar Firmas en Base de Datos
```bash
node scripts/setup-firmas-ejemplo.mjs
```

### 2. Verificar API de Firmas
```bash
curl "http://localhost:3000/api/firmas?empresaId=2"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "nombre": "Dr. Juan Carlos Pérez López",
      "cargo": "Director Académico",
      "firmaUrl": "/uploads/firmas/firma-director.png"
    },
    ...
  ]
}
```

### 3. Flujo Completo en la Aplicación

1. **Accede al dashboard:** `http://localhost:3000/[slug]/dashboard`

2. **Paso 1:** Configura curso y tipo de documento

3. **Paso 2:** Sube Excel con datos

4. **Paso 3:** Configura plantilla

5. **Paso 4:** Configura textos

6. **Paso 5:** Selecciona firmas
   - Deberías ver las 3 firmas cargadas desde la BD
   - Selecciona hasta 3 firmas
   - Confirma selección

7. **Paso 6:** Vista previa
   - Deberías ver las firmas seleccionadas en la vista previa

8. **Generar certificados**
   - Los PDF tendrán las firmas de la BD
   - El curso del paso 1 aparecerá en el certificado
   - Los datos se guardarán en la BD con relaciones correctas

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Scripts SQL
- ✅ `scripts/EJECUTAR-AHORA-fix-completo.sql`
- ✅ `scripts/ejecutar-migracion-completa.mjs`

### Entidades
- ✅ `src/lib/entities/CertificadoFirma.ts` (ya existía)
- ✅ `src/lib/entities/Certificado.ts` (actualizada)

### APIs
- ✅ `src/app/api/firmas/route.ts` (corregida)
- ✅ `src/app/api/generar-certificados/route.ts` (ya estaba bien)

### Servicios
- ✅ `src/lib/services/CertificadoService.ts` (actualizada)

### Frontend
- ✅ `src/app/[slug]/dashboard/SelectorFirmas.tsx` (reescrita)
- ✅ `src/app/[slug]/dashboard/page.tsx` (actualizada)

---

## 🎯 RESULTADO FINAL

### Base de Datos
- ✅ Tabla `certificado_firmas` creada
- ✅ Campos `curso_nombre` y `horas_curso` agregados a `certificados`
- ✅ Relaciones entre certificados y firmas establecidas
- ✅ 3 firmas de ejemplo insertadas

### Backend
- ✅ API de firmas retorna datos correctos
- ✅ Servicio guarda curso_nombre y horas_curso
- ✅ Servicio relaciona certificados con firmas

### Frontend
- ✅ Componente carga firmas desde BD
- ✅ Muestra imágenes reales de firmas
- ✅ Envía firmas seleccionadas al generar certificados
- ✅ Envía curso del paso 1

### PDFs
- ✅ Certificados incluyen firmas de la BD
- ✅ Certificados incluyen curso del paso 1
- ✅ Todo se guarda correctamente en BD

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

1. **Gestión de Firmas**: Crear interfaz de administrador para agregar/editar/eliminar firmas
2. **Validaciones**: Agregar validaciones de tamaño/formato de imágenes de firmas
3. **Auditoría**: Registrar quién creó/modificó cada firma
4. **Multi-tenant**: Asegurar que cada empresa solo vea sus propias firmas

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Verifica que la migración SQL se ejecutó correctamente
2. Asegúrate de que existen firmas en la tabla `firmas_digitales`
3. Revisa los logs del servidor Next.js
4. Verifica la consola del navegador en las DevTools

---

**Fecha:** 2025-11-10
**Estado:** ✅ COMPLETADO
