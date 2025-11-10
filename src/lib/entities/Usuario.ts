// ============================================
// 📁 lib/entities/Usuario.ts
// ============================================
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';

// ✅ USA 'import type' para evitar dependencias circulares
import type { Empresa } from './Empresa';
import type { Lote } from './Lote';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_email')
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column()
  @Index('idx_empresa')
  empresa_id: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  // ✅ Relaciones con string literals
  @ManyToOne('Empresa', 'usuarios', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany('Lote', 'usuario')
  lotes: Lote[];
}