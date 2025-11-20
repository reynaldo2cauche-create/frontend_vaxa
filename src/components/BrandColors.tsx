'use client';

import { useEffect } from 'react';

interface BrandColorsProps {
  colorPrimario: string;
  colorSecundario: string;
}

/**
 * Componente que inyecta los colores de la empresa en las variables CSS
 * Permite que toda la aplicación use los colores personalizados de cada empresa
 */
export default function BrandColors({ colorPrimario, colorSecundario }: BrandColorsProps) {
  useEffect(() => {
    // Convertir hex a RGB para poder usar con opacidad
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0, 0, 0';

      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);

      return `${r}, ${g}, ${b}`;
    };

    // Establecer variables CSS
    document.documentElement.style.setProperty('--color-primario', colorPrimario);
    document.documentElement.style.setProperty('--color-secundario', colorSecundario);
    document.documentElement.style.setProperty('--color-primario-rgb', hexToRgb(colorPrimario));
    document.documentElement.style.setProperty('--color-secundario-rgb', hexToRgb(colorSecundario));
  }, [colorPrimario, colorSecundario]);

  return null; // Este componente no renderiza nada
}
