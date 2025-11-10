// src/lib/entities/FirmaDigital.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

export enum EstadoFirma {
  ACTIVO = "activo",
  INACTIVO = "inactivo"
}

@Entity("firmas_digitales")
export class FirmaDigital {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "empresa_id", type: "int" })
  empresaId: number;

  @Column({
    type: "varchar",
    length: 255,
    comment: "Nombre completo de la persona que firma"
  })
  nombre: string;

  @Column({
    type: "varchar",
    length: 255,
    comment: "Cargo/puesto de la persona"
  })
  cargo: string;

  @Column({
    name: "firma_url",
    type: "varchar",
    length: 500,
    comment: "Ruta de la imagen de la firma"
  })
  firmaUrl: string;

  @Column({
    type: "enum",
    enum: EstadoFirma,
    default: EstadoFirma.ACTIVO
  })
  estado: EstadoFirma;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
    precision: 6
  })
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    type: "datetime",
    precision: 6
  })
  fechaActualizacion: Date;
}
