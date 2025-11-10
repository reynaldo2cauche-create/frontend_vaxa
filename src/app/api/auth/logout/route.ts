// ============================================
// 📁 app/api/auth/logout/route.ts
// Cerrar sesión
// ============================================
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Eliminar cookie
  response.cookies.delete('vaxa_token');
  
  return response;
}