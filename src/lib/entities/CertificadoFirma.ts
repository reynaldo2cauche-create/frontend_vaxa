// src/lib/entities/CertificadoFirma.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from "typeorm";

@Entity("certificado_firmas")
@Index("idx_certificado", ["certificadoId"])
@Index("idx_firma", ["firmaId"])
@Index("unique_certificado_firma", ["certificadoId", "firmaId"], { unique: true })
export class CertificadoFirma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "certificado_id", type: "bigint" })
  certificadoId: number;

  @Column({ name: "firma_id", type: "int" })
  firmaId: number;

  @Column({
    type: "int",
    comment: "Orden: 1, 2 o 3"
  })
  orden: number;

  @CreateDateColumn({
    name: "fecha_asignacion",
    type: "datetime",
    precision: 6
  })
  fechaAsignacion: Date;
}
