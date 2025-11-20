// src/lib/entities/Logo.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { Empresa } from "./Empresa";

@Entity("logos_empresa")
export class Logo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "empresa_id", type: "int" })
  empresaId: number;

  @ManyToOne(() => Empresa, { onDelete: "CASCADE" })
  @JoinColumn({ name: "empresa_id" })
  empresa: Empresa;

  @Column({ type: "varchar", length: 100 })
  nombre: string;

  @Column({ type: "varchar", length: 500 })
  url: string;

  @Column({ 
    type: "tinyint",
    comment: "Posición del logo (1=izq, 2=der, 3=centro)"
  })
  posicion: 1 | 2 | 3;

  @Column({ 
    type: "tinyint",
    width: 1,
    default: 1,
    comment: "1=activo, 0=eliminado (soft delete)"
  })
  activo: number; // MySQL usa tinyint(1) para boolean

  @CreateDateColumn({ 
    name: "created_at",
    type: "datetime",
    precision: 6
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    name: "updated_at",
    type: "datetime",
    precision: 6
  })
  updatedAt: Date;
}