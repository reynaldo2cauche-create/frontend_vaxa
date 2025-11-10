// ============================================
// 📁 lib/entities/Empresa.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, Index } from 'typeorm';

// ✅ USA 'import type' para evitar dependencias circulares
import type { Usuario } from './Usuario';
import type { PlantillaConfig } from './PlantillaConfig';
import type { Lote } from './Lote';
import type { Certificado } from './Certificado';
import type { Participante } from './Participante';
import type { Curso } from './Curso';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_slug')
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_nombre')
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color_primario: string;

  @Column({ type: 'varchar', length: 7, default: '#8B5CF6' })
  color_secundario: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relaciones con string literals
  @OneToMany('Usuario', 'empresa')
  usuarios: Usuario[];

  @OneToOne('PlantillaConfig', 'empresa')
  plantilla: PlantillaConfig;

  @OneToMany('Lote', 'empresa')
  lotes: Lote[];

  @OneToMany('Certificado', 'empresa')
  certificados: Certificado[];

  @OneToMany('Participante', 'empresa')
  participantes: Participante[];

  @OneToMany('Curso', 'empresa')
  cursos: Curso[];
}

