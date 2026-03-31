import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('classes') // Optional: untuk kontrol nama tabel
export class Classes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  grade?: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ length: 100 })
  created_by: string;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;

  @Column({ length: 100, nullable: true })
  updated_by?: string;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;

  @Column({ length: 100, nullable: true })
  deleted_by?: string;

  // @OneToMany(() => Subject, (subject: Subject) => subject.classes)
  // subjects: Subject[];
}
