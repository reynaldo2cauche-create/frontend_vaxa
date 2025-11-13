import { AlertTriangle, X, TrendingUp, Package } from 'lucide-react';

interface ModalLimitePlanProps {
  isOpen: boolean;
  onClose: () => void;
  mensaje: string;
  disponibles: number;
  solicitados: number;
  emitidos: number;
  limite: number;
}

export default function ModalLimitePlan({
  isOpen,
  onClose,
  mensaje,
  disponibles,
  solicitados,
  emitidos,
  limite
}: ModalLimitePlanProps) {
  if (!isOpen) return null;

  const porcentajeUsado = Math.round((emitidos / limite) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro con blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Más compacto */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-scale-in">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icono de advertencia - Más pequeño */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
            <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Título - Más pequeño */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Límite de Plan Excedido
        </h3>

        {/* Mensaje principal - Texto más pequeño */}
        <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
          {mensaje}
        </p>

        {/* Estadísticas visuales - Más compacto */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            {/* Barra de progreso - Más delgada */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700">Uso del plan</span>
                <span className="text-xs font-bold text-amber-600">{porcentajeUsado}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${porcentajeUsado}%` }}
                />
              </div>
            </div>

            {/* Grid de estadísticas - Más compacto */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white/70 rounded-lg p-2.5 border border-amber-200">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-[10px] font-semibold text-gray-600 uppercase">Emitidos</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{emitidos}</p>
                <p className="text-[10px] text-gray-500">de {limite} certificados</p>
              </div>

              <div className="bg-white/70 rounded-lg p-2.5 border border-red-200">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <p className="text-[10px] font-semibold text-gray-600 uppercase">Disponibles</p>
                </div>
                <p className="text-xl font-bold text-red-600">{disponibles}</p>
                <p className="text-[10px] text-gray-500">certificados restantes</p>
              </div>

              <div className="col-span-2 bg-orange-100/50 rounded-lg p-2.5 border border-orange-300">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                  <p className="text-[10px] font-semibold text-gray-600 uppercase">Intentando generar</p>
                </div>
                <p className="text-xl font-bold text-orange-600">{solicitados}</p>
                <p className="text-[10px] text-gray-500">certificados (excede el límite)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de ayuda - Más compacto */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 text-xs text-blue-800">
              <p className="font-semibold mb-0.5">¿Necesitas más certificados?</p>
              <p className="text-[10px] leading-relaxed">
                Contacta con el equipo de ventas para ampliar tu plan y seguir emitiendo certificados sin límites.
              </p>
            </div>
          </div>
        </div>

        {/* Botón de cerrar - Más pequeño */}
        <button
          onClick={onClose}
          className="w-full px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-semibold shadow-lg transition-all transform hover:scale-105 text-sm"
        >
          Entendido
        </button>
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
