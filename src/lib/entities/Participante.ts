// ============================================
// 📁 lib/entities/Participante.ts
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

export enum TipoDocumento {
  DNI = 'DNI',
  CE = 'CE',
  RUC = 'RUC',
  PASAPORTE = 'Pasaporte',
  OTRO = 'Otro'
}

@Entity('participantes')
@Index('idx_documento', ['tipo_documento', 'numero_documento'])
@Index('idx_nombres', ['nombres', 'apellidos'])
@Index('idx_correo', ['correo_electronico'])
@Index('idx_empresa', ['empresa_id'])
export class Participante {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  // Identificación
  @Column({
    type: 'enum',
    enum: TipoDocumento,
    default: TipoDocumento.DNI
  })
  tipo_documento: TipoDocumento;

  @Column({ type: 'varchar', length: 20 })
  numero_documento: string;

  // Datos personales
  @Column({ type: 'varchar', length: 10, nullable: true })
  termino: string | null;

  @Column({ type: 'varchar', length: 255 })
  nombres: string;

  @Column({ type: 'varchar', length: 255 })
  apellidos: string;

  // Este campo es generado por MySQL automáticamente
  // No lo incluimos en TypeORM para evitar conflictos
  // Accede a él con: participante.nombres + ' ' + participante.apellidos
  // O con una query raw si lo necesitas

  // Contacto
  @Column({ type: 'varchar', length: 255, nullable: true })
  correo_electronico: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  // Ubicación
  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string | null;

  // Metadatos
  @Column()
  empresa_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @ManyToOne('Empresa', 'participantes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany('Certificado', 'participante')
  certificados: Certificado[];
}
