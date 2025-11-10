import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { texto } = await req.json();

    if (!texto || typeof texto !== 'string') {
      return NextResponse.json(
        { error: 'Texto inválido' },
        { status: 400 }
      );
    }

    // Mejoras inteligentes del texto
    const textoMejorado = mejorarTextoProfesional(texto);

    return NextResponse.json({
      textoOriginal: texto,
      textoMejorado: textoMejorado,
      cambios: compararTextos(texto, textoMejorado)
    });

  } catch (error) {
    console.error('Error al mejorar texto:', error);
    return NextResponse.json(
      { error: 'Error al procesar el texto' },
      { status: 500 }
    );
  }
}

function mejorarTextoProfesional(texto: string): string {
  let mejorado = texto.trim();

  // 1. Correcciones ortográficas comunes
  const correccionesOrtograficas: { [key: string]: string } = {
    // Acentuaciones
    'participacion': 'participación',
    'certificacion': 'certificación',
    'capacitacion': 'capacitación',
    'reconocimiento': 'reconocimiento',
    'exitosa': 'exitosa',
    'satisfactoriamente': 'satisfactoriamente',
    'culminacion': 'culminación',
    'finalizacion': 'finalización',
    'realizacion': 'realización',
    'identificado': 'identificado',
    'numero': 'número',
    'codigo': 'código',
    'exito': 'éxito',
    'gracias': 'gracias',
    'tambien': 'también',
    'ademas': 'además',
    'mas': 'más',
    'dia': 'día',
    'aqui': 'aquí',
    'alli': 'allí',
    'ahi': 'ahí',
    'razon': 'razón',
    'decision': 'decisión',
    'acion': 'ación',
    'eduacion': 'educación',
    'especializacion': 'especialización',

    // Mayúsculas en siglas
    ' dni ': ' DNI ',
    ' ruc ': ' RUC ',
    ' ce ': ' CE ',
    ' rne ': ' RNE ',

    // Informalidades
    'ps': 'pues',
    'porfavor': 'por favor',
    'porfa': 'por favor',
    'xq': 'porque',
    'q ': 'que ',
    ' q ': ' que ',
    'tmb': 'también',
    'tb': 'también',
    'pa ': 'para ',
    ' pa ': ' para ',
    'aca': 'acá',
    'bn': 'bien',
    'x': 'por',
    'xk': 'porque',
    'd ': 'de ',
    ' d ': ' de ',

    // Palabras mal escritas
    'haver': 'haber',
    'aver': 'haber',
    'ha sido': 'ha sido',
    'asia': 'hacia',
    'asta': 'hasta',
    'echo': 'hecho',
    'hecho': 'hecho',
    'haora': 'ahora',
    'oir': 'oír',
    'hubieron': 'hubo',
    'habian': 'había',
    'habemos': 'hemos',

    // Gerundios incorrectos
    'culminando': 'culminar',
    'finalizando': 'finalizar',
    'completando': 'completar',
  };

  // Aplicar correcciones ortográficas
  Object.entries(correccionesOrtograficas).forEach(([incorrecto, correcto]) => {
    const regex = new RegExp(`\\b${incorrecto}\\b`, 'gi');
    mejorado = mejorado.replace(regex, correcto);
  });

  // 2. Transformación a lenguaje profesional
  const transformacionesProfesionales: { [key: string]: string } = {
    // Inicios informales
    'se le da': 'se otorga',
    'se le entrega': 'se otorga',
    'recibe': 'se otorga el presente certificado a',
    'le damos': 'se otorga',
    'damos': 'se otorga',
    'entregamos': 'se otorga',

    // Verbos más formales
    'termino': 'completó satisfactoriamente',
    'terminar': 'completar satisfactoriamente',
    'acabo': 'completó',
    'acabar': 'completar',
    'hizo': 'realizó',
    'hacer': 'realizar',
    'paso': 'aprobó',
    'pasar': 'aprobar',
    'estuvo en': 'participó en',
    'fue a': 'asistió a',
    'asistio': 'asistió',
    'participo': 'participó',
    'completo': 'completó',
    'culmino': 'culminó',
    'finalizo': 'finalizó',

    // Expresiones más formales
    'por su participacion': 'por su destacada participación',
    'por participar': 'por su participación',
    'por estar': 'por su asistencia',
    'por venir': 'por su asistencia',
    'por asistir': 'por su asistencia',
    'ha terminado': 'ha completado satisfactoriamente',
    'termino el curso': 'completó satisfactoriamente el curso',
    'paso el curso': 'aprobó exitosamente el curso',
    'hizo el curso': 'completó el curso',

    // Reconocimientos formales
    'buen trabajo': 'excelente desempeño',
    'trabajo bien': 'desempeño satisfactorio',
    'lo hizo bien': 'demostró un desempeño satisfactorio',
  };

  Object.entries(transformacionesProfesionales).forEach(([informal, formal]) => {
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    mejorado = mejorado.replace(regex, formal);
  });

  // 3. Capitalización correcta
  mejorado = mejorado.charAt(0).toUpperCase() + mejorado.slice(1);

  // 4. Estructura profesional para certificados
  if (!mejorado.match(/^(Se otorga|Por medio del presente|La presente institución|Certificamos que|El presente documento certifica|Por la presente se certifica)/i)) {
    // Si no tiene un inicio formal, agregarlo
    if (mejorado.match(/^[A-Z]/)) {
      mejorado = 'Se otorga el presente certificado a ' + mejorado.charAt(0).toLowerCase() + mejorado.slice(1);
    }
  }

  // 5. Agregar punto final si falta
  if (!mejorado.match(/[.!?]$/)) {
    mejorado += '.';
  }

  // 6. Correcciones de espaciado
  mejorado = mejorado.replace(/\s+/g, ' '); // Espacios múltiples
  mejorado = mejorado.replace(/\s([.,;:!?])/g, '$1'); // Espacios antes de puntuación
  mejorado = mejorado.replace(/([.,;:!?])(\w)/g, '$1 $2'); // Espacios después de puntuación

  // 7. Capitalizar después de puntos
  mejorado = mejorado.replace(/\.\s+(\w)/g, (match, letter) => '. ' + letter.toUpperCase());

  // 8. Mejorar frases comunes en certificados
  const mejorasContextuales: Array<[RegExp, string]> = [
    [/identificado con (dni|ce|rne|ruc) n[°º]?\s*/gi, 'identificado(a) con $1 N° '],
    [/por haber (completado|culminado|finalizado)/gi, 'por haber $1 satisfactoriamente'],
    [/curso de (.+?)([.,])/gi, 'curso de "$1"$2'],
    [/el dia/gi, 'el día'],
    [/(\d+)\s*horas/gi, '$1 horas académicas'],
  ];

  mejorasContextuales.forEach(([pattern, replacement]) => {
    mejorado = mejorado.replace(pattern, replacement);
  });

  return mejorado.trim();
}

function compararTextos(original: string, mejorado: string): string[] {
  const cambios: string[] = [];

  if (original.toLowerCase() !== mejorado.toLowerCase()) {
    cambios.push('Se corrigieron errores ortográficos y de acentuación');
  }

  if (/\b(ps|xq|q |tmb|tb|pa |bn)\b/i.test(original)) {
    cambios.push('Se eliminaron informalidades del lenguaje');
  }

  if (mejorado.includes('satisfactoriamente') && !original.includes('satisfactoriamente')) {
    cambios.push('Se agregó lenguaje más formal y profesional');
  }

  if (mejorado.match(/^Se otorga/) && !original.match(/^Se otorga/i)) {
    cambios.push('Se mejoró la estructura inicial del certificado');
  }

  if (cambios.length === 0) {
    cambios.push('Se optimizó el formato y la estructura del texto');
  }

  return cambios;
}
