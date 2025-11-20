// ============================================
// 📁 lib/entities/PlantillaTexto.ts
// Plantillas de texto predefinidas SIN ERRORES
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum CategoriaPlantilla {
  ACADEMICO = 'academico',
  LABORAL = 'laboral',
  RECONOCIMIENTO = 'reconocimiento',
  OTRO = 'otro'
}

@Entity('plantillas_texto')
export class PlantillaTexto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string; // 'formal', 'capacitacion', 'reconocimiento'

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ type: 'text' })
  titulo: string; // "CERTIFICADO DE RECONOCIMIENTO"

  @Column({ type: 'text' })
  cuerpo: string; // Texto con variables: {nombre}, {apellido}, etc.

  @Column({ type: 'text', nullable: true })
  pie: string | null; // Texto del pie (opcional)

  @Column({ type: 'enum', enum: CategoriaPlantilla, default: CategoriaPlantilla.ACADEMICO })
  @Index('idx_categoria')
  categoria: CategoriaPlantilla;

  @Column({ type: 'boolean', default: true })
  @Index('idx_activo')
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;
}
