'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, Building2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface Empresa {
  id: number;
  slug: string;
  nombre: string;
  logo: string | null;
  color_primario: string;
  color_secundario: string;
}

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Cargar datos de la empresa
  useEffect(() => {
    async function loadEmpresa() {
      try {
        const response = await fetch(`/api/empresa/${slug}`);
        
        if (!response.ok) {
          setError('Empresa no encontrada');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setEmpresa(data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar empresa:', err);
        setError('Error al cargar la empresa');
        setLoading(false);
      }
    }

    loadEmpresa();
  }, [slug]);

  // Manejar login
  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          empresa_id: empresa!.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Error al iniciar sesión');
        setLoginLoading(false);
        return;
      }

      // ✅ Login exitoso - redirigir al dashboard de la empresa
      console.log('✅ Login exitoso, redirigiendo a:', `/${data.empresa.slug}/dashboard`);
      router.push(`/${data.empresa.slug}/dashboard`);
      
    } catch (err) {
      console.error('Error en login:', err);
      setLoginError('Error de conexión');
      setLoginLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error || !empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Empresa no encontrada'}
          </h1>
          <p className="text-gray-600 mb-4">
            La URL que intentas acceder no existe
          </p>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${empresa.color_primario}15, ${empresa.color_secundario}15)`
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo empresa */}
        <div className="text-center mb-8">
          {empresa.logo ? (
            <Image
              src={empresa.logo}
              alt={empresa.nombre}
              width={112}
              height={112}
              className="mx-auto rounded-2xl object-cover shadow-xl mb-6 border-4 border-white"
            />
          ) : (
            <div
              className="w-28 h-28 mx-auto rounded-2xl flex items-center justify-center shadow-xl mb-6 border-4 border-white"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
              }}
            >
              <Building2 className="w-14 h-14 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {empresa.nombre}
          </h1>
          <p className="text-gray-600">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="tu@email.com"
                  disabled={loginLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  disabled={loginLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loginLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{loginError}</span>
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
              }}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Powered by <strong>VAXA</strong></p>
        </div>
      </div>
    </div>
  );
}