import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ModalEliminarLogoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombreLogo: string;
  loading?: boolean;
}

export default function ModalEliminarLogo({ 
  isOpen, 
  onClose, 
  onConfirm,
  nombreLogo,
  loading = false
}: ModalEliminarLogoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro con blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-scale-in">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono de advertencia */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
            <AlertTriangle className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-3">
          ¿Eliminar logo?
        </h3>

        {/* Mensaje */}
        <p className="text-gray-600 text-center mb-6">
          Estás a punto de eliminar{' '}
          <span className="font-bold text-red-600">
            {nombreLogo}
          </span>
          . Esta acción no se puede deshacer.
        </p>

        {/* Detalles de advertencia */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-sm text-red-800">
              <p className="font-semibold mb-1">Ten en cuenta:</p>
              <ul className="space-y-1 text-xs">
                <li>• El logo se eliminará permanentemente</li>
                <li>• No podrás recuperarlo después</li>
                <li>• Los certificados futuros no lo incluirán</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold shadow-lg transition-all flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Sí, eliminar logo
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
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