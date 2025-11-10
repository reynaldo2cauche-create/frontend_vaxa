// src/lib/types/index.ts

/**
 * Tipos TypeScript compartidos en toda la aplicación
 */

// ===== EMPRESA =====
export interface EmpresaPublica {
  id: number;
  slug: string;
  nombre: string;
  logo: string | null;
  color_primario: string;
  color_secundario: string;
}

// ===== USUARIO =====
export interface UsuarioSesion {
  id: number;
  email: string;
  nombre: string;
  role: 'admin' | 'usuario';
  empresa_id: number;
}

// ===== CERTIFICADO =====
export interface CertificadoDetalle {
  codigo: string;
  empresa: {
    nombre: string;
    logo: string | null;
  };
  datos: {
    [campo: string]: string;
  };
  fecha_emision: Date;
  archivo_url: string;
  estado: 'activo' | 'revocado';
}

export interface CertificadoResumen {
  id: number;
  codigo: string;
  fecha_emision: Date;
  estado: string;
  titular?: string; // Nombre del titular si existe
}

// ===== LOTE =====
export interface LoteDetalle {
  id: number;
  nombre: string;
  total_certificados: number;
  certificados_generados: number;
  estado: 'procesando' | 'completado' | 'completado_con_errores' | 'error';
  fecha_generacion: Date;
  archivo_zip?: string | null;
}

// ===== PLANTILLA =====
export interface PlantillaConfiguracion {
  fondo: string;
  ancho: number;
  alto: number;
  campos: {
    [nombreCampo: string]: CampoConfiguracion;
  };
  qr: QRConfiguracion;
  codigo: CodigoConfiguracion;
}

export interface CampoConfiguracion {
  x: number;
  y: number;
  size: number;
  color: string;
  font: string;
  align?: 'left' | 'center' | 'right';
}

export interface QRConfiguracion {
  x: number;
  y: number;
  size: number;
}

export interface CodigoConfiguracion {
  x: number;
  y: number;
  size: number;
  color: string;
}

// ===== EXCEL =====
export interface ExcelPreview {
  columnas: string[];
  filas: { [key: string]: any }[];
  total_registros: number;
}

export interface MapeoColumnas {
  [campoPlantilla: string]: string; // nombre_campo -> columna_excel
}

// ===== API RESPONSES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// ===== DASHBOARD =====
export interface DashboardStats {
  total_certificados: number;
  certificados_mes: number;
  certificados_hoy: number;
  ultimo_lote: string | null;
}

// ===== VALIDACIÓN =====
export interface ResultadoValidacion {
  valido: boolean;
  certificado?: CertificadoDetalle;
  error?: string;
}

// ===== GENERACIÓN =====
export interface SolicitudGeneracion {
  empresa_id: number;
  nombre_lote: string;
  datos_excel: { [key: string]: any }[];
  mapeo: MapeoColumnas;
}

export interface ResultadoGeneracion {
  lote_id: number;
  total_generados: number;
  certificados: string[]; // Array de códigos
  zip_url: string;
  errores?: ErrorGeneracion[];
}

export interface ErrorGeneracion {
  fila: number;
  error: string;
}

// ===== AUTENTICACIÓN =====
export interface LoginRequest {
  email: string;
  password: string;
  empresa_slug: string;
}

export interface LoginResponse {
  success: boolean;
  usuario?: UsuarioSesion;
  empresa?: EmpresaPublica;
  error?: string;
}

// ===== ARCHIVOS =====
export interface ArchivoSubido {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

// ===== PAGINACIÓN =====
export interface PaginacionParams {
  page: number;
  limit: number;
  order_by?: string;
  order_dir?: 'ASC' | 'DESC';
}

export interface PaginacionResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ===== BÚSQUEDA =====
export interface BusquedaParams {
  query: string;
  campo?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

// ===== ESTADÍSTICAS =====
export interface EstadisticasMensuales {
  mes: string;
  cantidad: number;
}

export interface EstadisticasPorEstado {
  activos: number;
  revocados: number;
  total: number;
}

// ===== VALIDACIONES =====
export interface ValidacionArchivo {
  valido: boolean;
  error?: string;
  advertencias?: string[];
}

// ===== CONFIGURACIÓN ADMIN =====
export interface ConfiguracionEmpresa {
  plantilla_configurada: boolean;
  total_certificados: number;
  plan: 'basico' | 'pro' | 'enterprise';
  limite_mensual: number;
  certificados_usados_mes: number;
}