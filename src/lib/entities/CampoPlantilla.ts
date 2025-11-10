// ============================================
// 📁 lib/entities/CampoPlantilla.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

// ✅ USA 'import type' para evitar dependencias circulares
import type { PlantillaConfig } from './PlantillaConfig';

@Entity('campos_plantilla')
export class CampoPlantilla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_plantilla')
  plantilla_id: number;

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_nombre_campo')
  nombre_campo: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'int' })
  x: number;

  @Column({ type: 'int' })
  y: number;

  @Column({ type: 'int', default: 20 })
  font_size: number;

  @Column({ type: 'varchar', length: 100, default: 'Arial' })
  font_family: string;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  font_color: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  requerido: boolean;

  // ✅ Relación con string literal
  @ManyToOne('PlantillaConfig', 'campos', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_id' })
  plantilla: PlantillaConfig;
}