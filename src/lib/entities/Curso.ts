// ============================================
// 📁 lib/entities/Curso.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import type { Empresa } from './Empresa';
import type { Certificado } from './Certificado';

export enum TipoCertificado {
  CERTIFICADO = 'Certificado',
  CONSTANCIA = 'Constancia',
  DIPLOMA = 'Diploma',
  RECONOCIMIENTO = 'Reconocimiento'
}

export enum ModalidadCurso {
  PRESENCIAL = 'Presencial',
  VIRTUAL = 'Virtual',
  HIBRIDO = 'Híbrido',
  OTRO = 'Otro'
}

@Entity('cursos')
@Index('idx_empresa', ['empresa_id'])
@Index('idx_nombre', ['nombre'])
@Index('idx_tipo', ['tipo_documento'])
@Index('idx_fechas', ['fecha_inicio', 'fecha_fin'])
@Index('idx_activo', ['activo'])
export class Curso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  // Información del curso
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({
    type: 'enum',
    enum: TipoCertificado,
    default: TipoCertificado.CERTIFICADO
  })
  tipo_documento: TipoCertificado;

  // Detalles académicos
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  horas_academicas: number | null;

  @Column({
    type: 'enum',
    enum: ModalidadCurso,
    nullable: true
  })
  modalidad: ModalidadCurso | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string | null;

  // Fechas
  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date | null;

  // Ponente/Instructor
  @Column({ type: 'varchar', length: 255, nullable: true })
  ponente: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cargo_ponente: string | null;

  // Descripción
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  // Estado
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @ManyToOne('Empresa', 'cursos', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany('Certificado', 'curso')
  certificados: Certificado[];
}
