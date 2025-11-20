// ============================================
// 📁 lib/entities/BloqueTexto.ts
// Bloques de texto personalizables con posición
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import type { PlantillaConfig } from './PlantillaConfig';

export enum Alineacion {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify'
}

export enum FontWeight {
  NORMAL = 'normal',
  BOLD = 'bold',
  BOLDER = 'bolder',
  LIGHTER = 'lighter'
}

@Entity('bloques_texto')
export class BloqueTexto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_plantilla')
  plantilla_id: number;

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_nombre')
  nombre: string; // 'titulo', 'cuerpo', 'pie', 'firma'

  @Column({ type: 'text' })
  contenido: string; // Puede tener variables: {nombre}, {apellido}

  // Posición y dimensiones
  @Column({ type: 'int' })
  x: number;

  @Column({ type: 'int' })
  y: number;

  @Column({ type: 'int', nullable: true })
  ancho: number | null; // Ancho máximo para word wrap

  // Tipografía
  @Column({ type: 'int', default: 16 })
  font_size: number;

  @Column({ type: 'varchar', length: 100, default: 'Arial' })
  font_family: string;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  font_color: string;

  @Column({ type: 'enum', enum: FontWeight, default: FontWeight.NORMAL })
  font_weight: FontWeight;

  // Alineación y espaciado
  @Column({ type: 'enum', enum: Alineacion, default: Alineacion.CENTER })
  alineacion: Alineacion;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 1.5 })
  line_height: number;

  // Control
  @Column({ type: 'int', default: 0 })
  @Index('idx_orden')
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relación
  @ManyToOne('PlantillaConfig', 'bloques_texto', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_id' })
  plantilla: PlantillaConfig;
}
