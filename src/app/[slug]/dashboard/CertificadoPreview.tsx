'use client';

import { useEffect, useState, useRef } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Logo } from '@/lib/entities/Logo';

function convertirFechaExcel(valor: any): string {
  if (!valor) return '';
  if (typeof valor === 'string' && valor.includes('/')) return valor;
  
  if (typeof valor === 'number') {
    const fechaExcel = XLSX.SSF.parse_date_code(valor);
    if (fechaExcel) {
      const dia = String(fechaExcel.d).padStart(2, '0');
      const mes = String(fechaExcel.m).padStart(2, '0');
      const anio = fechaExcel.y;
      return `${dia}/${mes}/${anio}`;
    }
  }
  
  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, '0');
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const anio = valor.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  
  return String(valor);
}

function convertirHoras(valor: any): number {
  if (typeof valor === 'number') return Math.round(valor);
  if (typeof valor === 'string') return parseInt(valor) || 0;
  return 0;
}

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  url: string;
}

interface Props {
  plantillaUrl: string | null;
  datosParticipante: any;
  textoEstatico: string;
  firmas: Firma[];
  logos?: Logo[];
  tipoDocumento?: string;
  curso?: string;
}

export default function CertificadoPreview({
  plantillaUrl,
  datosParticipante,
  textoEstatico,
  firmas,
  logos = [],
  tipoDocumento = '',
  curso = ''
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const a4Width = 1122;
        const calculatedScale = Math.min(containerWidth / a4Width, 1);
        setScale(calculatedScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const nombreCompleto = `${datosParticipante?.['Término'] || ''} ${datosParticipante?.['Nombres'] || ''} ${datosParticipante?.['Apellidos'] || ''}`.trim();
  const tituloMostrar = tipoDocumento || datosParticipante?.['Tipo de Documento'] || 'CERTIFICADO DE PARTICIPACIÓN';
  const cursoMostrar = curso || datosParticipante?.['Nombre del Curso'] || '';
  const fechaEmision = convertirFechaExcel(datosParticipante?.['Fecha de Emisión']);
  const horas = datosParticipante?.['Horas Académicas'] ? convertirHoras(datosParticipante['Horas Académicas']) : null;

  // Procesar texto estático
  const MAX_CARACTERES = 300;
  let cuerpoFinal = textoEstatico || '';
  if (cuerpoFinal.length > MAX_CARACTERES) {
    cuerpoFinal = cuerpoFinal.substring(0, MAX_CARACTERES) + '...';
  }
  const esTextoLargo = cuerpoFinal.length > 200;

  // Ordenar logos por posición
  const logosActivos = logos.filter(l => l.activo === undefined || l.activo === 1);
  const logosOrdenados = [...logosActivos].sort((a, b) => a.posicion - b.posicion);

  const descargarPreview = () => {
    // Implementar descarga como imagen si es necesario
    alert('Para descargar el certificado final, genera el PDF desde el botón principal');
  };

  if (!plantillaUrl) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
        <p className="text-yellow-800 font-semibold mb-2">
          ⚠️ No se ha cargado la plantilla de fondo
        </p>
        <p className="text-sm text-yellow-700">
          Asegúrate de haber completado el Paso 2: Subir Plantilla
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-gray-800">📄 Vista previa del certificado:</h5>
     
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* CERTIFICADO EN HTML - EXACTO AL PDF CON ESCALA RESPONSIVE */}
      <div 
        ref={containerRef}
        className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{
          width: '100%',
          height: `${794 * scale + 4}px`
        }}
      >
        <div 
          className="certificado-preview"
          style={{
            width: '1122px',
            height: '794px',
            position: 'absolute',
            top: 0,
            left: 0,
            fontFamily: 'Arial, Helvetica, sans-serif',
            overflow: 'hidden',
            transformOrigin: 'top left',
            transform: `scale(${scale})`
          }}
        >
          {/* FONDO */}
          <img 
            src={plantillaUrl} 
            alt="Fondo"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />

          {/* CONTENIDO */}
          <div 
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              padding: '35px 80px 30px 80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* LOGOS */}
            {logosOrdenados.map((logo, index) => {
              let style: React.CSSProperties = {
                position: 'absolute',
                width: '180px',
                height: '120px',
                objectFit: 'contain',
                top: '20px'
              };

              if (logo.posicion === 1) {
                style.left = '60px';
              } else if (logo.posicion === 2) {
                style.right = '60px';
              } else if (logo.posicion === 3) {
                style.left = '50%';
                style.transform = 'translateX(-50%)';
              }

              return (
                <img 
                  key={logo.id}
                  src={logo.url} 
                  alt={`Logo ${logo.nombre}`}
                  style={style}
                />
              );
            })}

            {/* CENTRO */}
            <div 
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '40px 100px 0 100px',
                marginTop: '-10px'
              }}
            >
              {/* TÍTULO */}
              <div 
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1a365d',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px'
                }}
              >
                {tituloMostrar}
              </div>

              {/* NOMBRE */}
              <div 
                style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  margin: '15px 0 20px 0',
                  fontFamily: 'Georgia, Times New Roman, serif',
                  lineHeight: '1.2',
                  maxWidth: '900px'
                }}
              >
                {nombreCompleto}
              </div>

              {/* CUERPO */}
              <div 
                className={esTextoLargo ? 'texto-largo' : ''}
                style={{
                  fontSize: esTextoLargo ? '18px' : '20px',
                  color: '#475569',
                  lineHeight: esTextoLargo ? '1.5' : '1.6',
                  maxWidth: '880px',
                  margin: '15px 0 20px 0'
                }}
              >
                {cuerpoFinal}
              </div>

              {/* CURSO */}
              {cursoMostrar && (
                <div 
                  style={{
                    fontSize: '22px',
                    fontStyle: 'italic',
                    color: '#1e40af',
                    margin: '15px 0 0 0',
                    fontFamily: 'Georgia, Times New Roman, serif',
                    lineHeight: '1.3',
                    maxWidth: '800px'
                  }}
                >
                  "{cursoMostrar}"
                </div>
              )}
            </div>

            {/* PIE */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 50px',
                marginBottom: '10px'
              }}
            >
              {/* DATOS */}
              <div 
                style={{
                  fontSize: '16px',
                  color: '#64748b',
                  lineHeight: '1.4'
                }}
              >
                <div>Fecha: {fechaEmision}</div>
                {horas && <div>Duración: {horas} horas</div>}
              </div>
            </div>

            {/* QR */}
            <div 
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '70px',
                textAlign: 'center'
              }}
            >
              <div 
                style={{
                  width: '100px',
                  height: '100px',
                  marginBottom: '6px',
                  backgroundColor: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                QR
              </div>
              <div 
                style={{
                  fontSize: '9px',
                  color: '#94a3b8',
                  fontFamily: 'Courier New, monospace',
                  wordBreak: 'break-all',
                  maxWidth: '110px'
                }}
              >
                VAXA-X-XXXXXXX-XXXX
              </div>
            </div>

            {/* FIRMAS */}
            {firmas && firmas.length > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '75px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '80px',
                  width: '80%',
                  maxWidth: '650px'
                }}
              >
                {firmas.map((firma) => (
                  <div 
                    key={firma.id}
                    style={{
                      textAlign: 'center',
                      flex: 1,
                      maxWidth: '180px'
                    }}
                  >
                    {firma.url && (
                      <img 
                        src={firma.url}
                        alt={`Firma ${firma.nombre}`}
                        style={{
                          width: '160px',
                          height: '60px',
                          objectFit: 'contain',
                          objectPosition: 'center bottom',
                          marginBottom: '-12px',
                          display: 'block',
                          marginLeft: 'auto',
                          marginRight: 'auto'
                        }}
                      />
                    )}
                    <div 
                      style={{
                        borderTop: '1.5px solid #475569',
                        width: '100%',
                        marginBottom: '3px'
                      }}
                    />
                    <div 
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}
                    >
                      {firma.nombre}
                    </div>
                    <div 
                      style={{
                        fontSize: '9px',
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}
                    >
                      {firma.cargo}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FOOTER */}
            <div 
              style={{
                position: 'absolute',
                bottom: '10px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '10px',
                color: '#9ca3af'
              }}
            >
              Certificado generado por VAXA - Sistema de Certificación
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          ℹ️ Esta es una representación exacta de cómo se verá el certificado final en PDF
        </p>
      </div>
    </div>
  );
}