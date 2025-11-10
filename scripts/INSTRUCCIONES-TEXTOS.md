# 📝 Sistema de Textos para Certificados - Instrucciones

## 🎯 Objetivo

Prevenir **errores ortográficos** en certificados mediante:
1. ✅ Plantillas de texto predefinidas (sin errores)
2. ✅ Bloques de texto personalizables con posición
3. ✅ Sistema de aprobación (opcional)

---

## 📦 Instalación

### Paso 1: Ejecutar el SQL

```bash
mysql -u root -p vaxa < scripts/agregar-textos-certificados.sql
```

O desde phpMyAdmin: Importar → `scripts/agregar-textos-certificados.sql`

### Paso 2: Verificar las tablas creadas

Deberías ver 2 nuevas tablas:
- `plantillas_texto` (6 plantillas predefinidas)
- `bloques_texto` (bloques personalizables)

Y nuevos campos en `plantillas_config`:
- `plantilla_texto_id`
- `requiere_aprobacion`
- `aprobada`
- `aprobada_por`
- `fecha_aprobacion`

---

## 🚀 Cómo usar

### **Opción A: Usar plantilla predefinida** (SIN errores) ⭐ Recomendada

```typescript
// Al configurar una plantilla de certificado:
await PlantillaConfig.update(
  { empresa_id: 1 },
  {
    plantilla_texto_id: 1,  // ID de la plantilla 'formal'
    imagen_fondo: '/certificados/1/template.png'
  }
);
```

**Plantillas disponibles:**
- `formal` (ID: 1) - Certificado formal estándar
- `capacitacion` (ID: 2) - Capacitación técnica
- `reconocimiento` (ID: 3) - Reconocimiento por logros
- `participacion` (ID: 4) - Participación en evento
- `asistencia` (ID: 5) - Asistencia a taller
- `laboral` (ID: 6) - Experiencia laboral

### **Opción B: Bloques de texto personalizados**

```typescript
// Crear bloques de texto para una plantilla:
const bloques = [
  {
    plantilla_id: 1,
    nombre: 'titulo',
    contenido: 'CERTIFICADO DE RECONOCIMIENTO',
    x: 400,
    y: 150,
    font_size: 32,
    font_color: '#1E40AF',
    font_weight: 'bold',
    alineacion: 'center',
    orden: 1
  },
  {
    plantilla_id: 1,
    nombre: 'cuerpo',
    contenido: 'Se otorga a {nombre} {apellido}...',
    x: 400,
    y: 300,
    font_size: 18,
    alineacion: 'justify',
    ancho: 700,  // Word wrap
    orden: 2
  }
];

await BloqueTexto.insert(bloques);
```

---

## 🔧 Variables disponibles

Puedes usar estas variables en los textos (se reemplazan al generar):

```
{nombre}
{apellido}
{tipo_documento}
{numero_documento}
{documento}
{curso}
{fecha}
{fecha_inicio}
{fecha_fin}
{horas}
{ciudad}
{evento}
{cargo}
{dia}
{mes}
{anio}
```

**Ejemplo:**
```
"Se otorga a {nombre} {apellido}, DNI {documento}, por {curso}"
```

Se convierte en:
```
"Se otorga a Juan Pérez, DNI 12345678, por Marketing Digital"
```

---

## 🛡️ Sistema de aprobación

Para empresas que requieren aprobación antes de usar plantillas:

```typescript
// 1. Marcar que requiere aprobación
await PlantillaConfig.update(
  { id: 1 },
  { requiere_aprobacion: true }
);

// 2. Aprobar la plantilla
await PlantillaConfig.update(
  { id: 1 },
  {
    aprobada: true,
    aprobada_por: usuario_id,
    fecha_aprobacion: new Date()
  }
);

// 3. Validar antes de generar certificados
const plantilla = await PlantillaConfig.findOne({
  where: { empresa_id: 1 }
});

if (plantilla.requiere_aprobacion && !plantilla.aprobada) {
  throw new Error('La plantilla debe ser aprobada antes de usar');
}
```

---

## 📊 Consultas útiles

### Ver plantillas de texto disponibles
```sql
SELECT * FROM plantillas_texto WHERE activo = TRUE;
```

### Ver bloques de texto de una empresa
```sql
SELECT * FROM v_bloques_por_plantilla WHERE empresa_nombre = 'Instituto Futuro Digital';
```

### Ver plantillas completas con sus textos
```sql
SELECT * FROM v_plantillas_completas;
```

### Obtener plantilla con bloques
```typescript
const plantilla = await PlantillaConfig.findOne({
  where: { empresa_id: 1 },
  relations: ['plantilla_texto', 'bloques_texto', 'campos']
});

// Ordenar bloques por orden
plantilla.bloques_texto.sort((a, b) => a.orden - b.orden);
```

---

## 🎨 Ejemplo completo de generación

```typescript
async function generarCertificado(data: any) {
  // 1. Obtener plantilla
  const plantilla = await PlantillaConfig.findOne({
    where: { empresa_id: data.empresa_id },
    relations: ['plantilla_texto', 'bloques_texto', 'campos']
  });

  // 2. Verificar aprobación
  if (plantilla.requiere_aprobacion && !plantilla.aprobada) {
    throw new Error('Plantilla no aprobada');
  }

  // 3. Obtener textos
  let textos = [];

  if (plantilla.plantilla_texto_id) {
    // Usar plantilla predefinida
    textos = [
      {
        contenido: plantilla.plantilla_texto.titulo,
        x: 400,
        y: 150,
        font_size: 32,
        alineacion: 'center'
      },
      {
        contenido: reemplazarVariables(
          plantilla.plantilla_texto.cuerpo,
          data
        ),
        x: 400,
        y: 300,
        font_size: 18,
        alineacion: 'justify'
      }
    ];
  } else {
    // Usar bloques personalizados
    textos = plantilla.bloques_texto
      .filter(b => b.activo)
      .sort((a, b) => a.orden - b.orden)
      .map(bloque => ({
        contenido: reemplazarVariables(bloque.contenido, data),
        x: bloque.x,
        y: bloque.y,
        font_size: bloque.font_size,
        font_color: bloque.font_color,
        font_family: bloque.font_family,
        font_weight: bloque.font_weight,
        alineacion: bloque.alineacion,
        ancho: bloque.ancho
      }));
  }

  // 4. Generar imagen
  const imagen = await generarImagenCertificado({
    fondo: plantilla.imagen_fondo,
    textos,
    campos: data.campos,
    qr: { x: plantilla.qr_x, y: plantilla.qr_y }
  });

  return imagen;
}

function reemplazarVariables(texto: string, data: any): string {
  return texto
    .replace(/{nombre}/g, data.nombre || '')
    .replace(/{apellido}/g, data.apellido || '')
    .replace(/{documento}/g, data.documento || '')
    .replace(/{curso}/g, data.curso || '')
    .replace(/{fecha}/g, data.fecha || '');
}
```

---

## ✅ Ventajas de este sistema

1. **Cero errores ortográficos** en plantillas predefinidas
2. **Flexibilidad** para personalizar cuando sea necesario
3. **Control de aprobación** para empresas que lo requieran
4. **Reutilización** de textos validados
5. **Fácil mantenimiento** centralizado

---

## 🔄 Migración desde sistema anterior

Si ya tenías certificados, no hay problema:

1. Las tablas nuevas son **independientes**
2. No afectan certificados existentes
3. Puedes migrar gradualmente:

```sql
-- Crear bloques desde campos existentes
INSERT INTO bloques_texto (plantilla_id, nombre, contenido, x, y, font_size, font_color, orden)
SELECT
  plantilla_id,
  nombre_campo,
  label,
  x,
  y,
  font_size,
  font_color,
  orden
FROM campos_plantilla
WHERE plantilla_id = 1;
```

---

## 📞 Soporte

Si tienes dudas:
1. Revisa los ejemplos en el SQL
2. Consulta las vistas: `v_plantillas_completas`, `v_bloques_por_plantilla`
3. Verifica que TypeORM esté sincronizado correctamente

---

## 🎯 Próximos pasos sugeridos

1. **Vista previa obligatoria**: Mostrar el certificado antes de confirmar
2. **Historial de cambios**: Auditar modificaciones a plantillas
3. **Librería de corrección ortográfica**: Integrar en frontend
4. **Templates multilínea**: Soporte para textos largos con saltos de línea

---

**¡Listo!** Ahora tienes un sistema robusto para evitar errores ortográficos en tus certificados 🎉
