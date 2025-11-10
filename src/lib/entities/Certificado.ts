// ============================================
// 📁 lib/entities/Certificado.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Empresa } from './Empresa';
import { Lote } from './Lote';
import { DatoCertificado } from './DatoCertificado';
import type { Participante } from './Participante';
import type { Curso } from './Curso';
import { Usuario } from './Usuario';

export enum EstadoCertificado {
  ACTIVO = 'activo',
  REVOCADO = 'revocado'
}

@Entity('certificados')
@Index('idx_empresa_fecha', ['empresa_id', 'fecha_emision'])
export class Certificado {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_codigo')
  codigo: string;

  @Column()
  empresa_id: number;

  @Column({ nullable: true })
  @Index('idx_participante')
  participante_id: number | null;

  @Column({ nullable: true })
  @Index('idx_curso')
  curso_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index('idx_curso_nombre')
  curso_nombre: string | null;

  @Column({ type: 'int', nullable: true })
  horas_curso: number | null;

  @Column({ nullable: true })
  @Index('idx_lote')
  lote_id: number | null;

  @Column({ type: 'varchar', length: 500 })
  archivo_url: string;

  @CreateDateColumn()
  fecha_emision: Date;

  @Column({ type: 'enum', enum: EstadoCertificado, default: EstadoCertificado.ACTIVO })
  @Index('idx_estado')
  estado: EstadoCertificado;

  // Relaciones
  @ManyToOne(() => Empresa, empresa => empresa.certificados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne('Participante', 'certificados', { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'participante_id' })
  participante: Participante | null;

  @ManyToOne('Curso', 'certificados', { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'curso_id' })
  curso: Curso | null;

  @ManyToOne(() => Lote, lote => lote.certificados, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lote_id' })
  lote: Lote | null;

  @OneToMany(() => DatoCertificado, dato => dato.certificado)
  datos: DatoCertificado[];
}
