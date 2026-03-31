import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import type { Question } from '../../questions/entities/question.entity';

@Entity('choices')
export class Choice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  choiceText: string;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne('Question', 'choices', { onDelete: 'CASCADE' })
  question: Question;

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
}
