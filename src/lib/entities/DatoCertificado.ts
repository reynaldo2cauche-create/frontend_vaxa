// ============================================
// 📁 lib/entities/DatoCertificado.ts - DEFINITIVO
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';

// ✅ Usa 'type' import para evitar circular dependency
import type { Certificado } from './Certificado';

@Entity('datos_certificado')
@Unique('unique_campo_certificado', ['certificado_id', 'campo'])
export class DatoCertificado {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  @Index('idx_certificado')
  certificado_id: number;

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_campo')
  campo: string;

  @Column({ type: 'text' })
  valor: string;

  // ✅ La función arrow carga Certificado de forma lazy
  @ManyToOne('Certificado', 'datos', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificado_id' })
  certificado: Certificado;
}