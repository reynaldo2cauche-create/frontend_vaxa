import { CheckCircle2, X, Download } from 'lucide-react';

interface ModalExitoProps {
  isOpen: boolean;
  onClose: () => void;
  totalGenerados: number;
  onDescargarZip?: () => void;
  onNuevoLote?: () => void;
}

export default function ModalExitoCertificados({ 
  isOpen, 
  onClose, 
  totalGenerados,
  onDescargarZip 
}: ModalExitoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro con blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-scale-in">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-3">
          ¡Certificados Generados!
        </h3>

        {/* Mensaje */}
        <p className="text-gray-600 text-center mb-6">
          Se han generado exitosamente{' '}
          <span className="font-bold text-green-600 text-xl">
            {totalGenerados}
          </span>{' '}
          certificados con sus respectivos códigos QR únicos
        </p>

        {/* Detalles */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-sm text-green-800">
              <p className="font-semibold mb-1">Proceso completado</p>
              <ul className="space-y-1 text-xs">
                <li>✓ PDFs generados individualmente</li>
                <li>✓ Códigos QR únicos asignados</li>
                <li>✓ Guardados en la base de datos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          {onDescargarZip && (
            <button
              onClick={() => {
                onDescargarZip();
                onClose();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Descargar ZIP
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}