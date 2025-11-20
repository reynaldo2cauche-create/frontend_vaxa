// ============================================
// 📁 lib/entities/PlantillaConfig.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';

// ✅ USA 'import type' para evitar dependencias circulares
import type { Empresa } from './Empresa';
import type { CampoPlantilla } from './CampoPlantilla';
import type { BloqueTexto } from './BloqueTexto';

@Entity('plantillas_config')
export class PlantillaConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  empresa_id: number;

  @Column({ type: 'varchar', length: 500 })
  imagen_fondo: string;

  // ⭐ NUEVO: Plantilla de texto predefinida
  @Column({ type: 'int', nullable: true })
  plantilla_texto_id: number | null;

  // ⭐ NUEVO: Sistema de aprobación
  @Column({ type: 'boolean', default: false })
  requiere_aprobacion: boolean;

  @Column({ type: 'boolean', default: false })
  aprobada: boolean;

  @Column({ type: 'int', nullable: true })
  aprobada_por: number | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_aprobacion: Date | null;

  @Column({ type: 'int', default: 50 })
  qr_x: number;

  @Column({ type: 'int', default: 750 })
  qr_y: number;

  @Column({ type: 'int', default: 100 })
  qr_size: number;

  @Column({ type: 'int', default: 50 })
  codigo_x: number;

  @Column({ type: 'int', default: 870 })
  codigo_y: number;

  @Column({ type: 'int', default: 12 })
  codigo_size: number;

  @Column({ type: 'varchar', length: 7, default: '#666666' })
  codigo_color: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relaciones con string literals
  @OneToOne('Empresa', 'plantilla', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany('CampoPlantilla', 'plantilla')
  campos: CampoPlantilla[];

  // ⭐ NUEVO: Relaciones con textos
  @OneToMany('BloqueTexto', 'plantilla')
  bloques_texto: BloqueTexto[];
}