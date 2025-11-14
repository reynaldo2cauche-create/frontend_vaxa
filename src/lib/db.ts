// lib/db.ts

import "reflect-metadata";
import { DataSource } from "typeorm";
import { Empresa } from "./entities/Empresa";
import { Usuario } from "./entities/Usuario";
import { PlantillaConfig } from "./entities/PlantillaConfig";
import { CampoPlantilla } from "./entities/CampoPlantilla";
import { Lote } from "./entities/Lote";
import { Certificado } from "./entities/Certificado";
import { DatoCertificado } from "./entities/DatoCertificado";
import { PlantillaTexto } from "./entities/PlantillaTexto";
import { BloqueTexto } from "./entities/BloqueTexto";
import { Participante } from "./entities/Participante";
import { Curso } from "./entities/Curso";
import { Logo } from "./entities/Logo";
import { FirmaDigital } from "./entities/FirmaDigital";
import { CertificadoFirma } from "./entities/CertificadoFirma";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "vaxa",
  synchronize: process.env.NODE_ENV === "development", // Solo en desarrollo
  logging: process.env.NODE_ENV === "development",
  entities: [
    Empresa,
    Usuario,
    PlantillaConfig,
    CampoPlantilla,
    Lote,
    Certificado,
    DatoCertificado,
    PlantillaTexto,
    BloqueTexto,
    Participante,
    Curso,
    Logo,
    FirmaDigital,
    CertificadoFirma
  ],
  charset: "utf8mb4",

  timezone: "-05:00", // Zona horaria de Perú (UTC-5)
});

let isInitialized = false;

/**
 * Inicializa la conexión a la base de datos
 * Solo se ejecuta una vez
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (!isInitialized) {
    try {
      await AppDataSource.initialize();
      isInitialized = true;
      console.log("✅ Base de datos conectada");
    } catch (error) {
      console.error("❌ Error al conectar a la base de datos:", error);
      throw error;
    }
  }
  return AppDataSource;
}

/**
 * Obtiene el DataSource, inicializándolo si es necesario
 */
export async function getDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await initializeDatabase();
  }
  return AppDataSource;
}

/**
 * Cierra la conexión a la base de datos
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    isInitialized = false;
    console.log("🔌 Conexión a base de datos cerrada");
  }
}