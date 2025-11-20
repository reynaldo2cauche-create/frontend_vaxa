'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Ruta dinámica limpia: /validar/[codigo]
 * Redirige a /validar?codigo=[codigo] para mantener compatibilidad
 */
export default function ValidarCodigoPage() {
  const params = useParams();
  const router = useRouter();
  const codigo = params.codigo as string;

  useEffect(() => {
    if (codigo) {
      // Redirigir a la página principal con el parámetro
      router.replace(`/validar?codigo=${codigo}`);
    }
  }, [codigo, router]);

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-emerald-700 font-medium">Validando certificado...</p>
      </div>
    </div>
  );
}
