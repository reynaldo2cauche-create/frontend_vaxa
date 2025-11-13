// ============================================
// 📁 lib/entities/Lote.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';

// ✅ USA 'import type' para evitar dependencias circulares
import type { Empresa } from './Empresa';
import type { Usuario } from './Usuario';
import type { Certificado } from './Certificado';

@Entity('lotes')
@Index('idx_empresa_fecha', ['empresa_id', 'fecha_procesado'])
export class Lote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre_archivo: string;

  @Column({ type: 'int', default: 0 })
  cantidad_certificados: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  zip_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo_documento: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  curso: string | null;

  @CreateDateColumn()
  fecha_procesado: Date;

  @Column({ nullable: true })
  usuario_id: number | null;

   // 🆕 NUEVO: Guardar el texto estático personalizado
  @Column({ type: 'text', nullable: true })
  texto_estatico!: string | null;

  // ✅ Relaciones con string literals
  @ManyToOne('Empresa', 'lotes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne('Usuario', 'lotes', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @OneToMany('Certificado', 'lote')
  certificados: Certificado[];
}