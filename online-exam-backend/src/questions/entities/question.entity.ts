import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Choice } from '../../choices/entities/choice.entity';

export type QuestionType = 'multiple_choice' | 'essay';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  exam_id: string;

  @Column({ name: 'question', type: 'text' })
  questionText: string;

  @Column({ type: 'varchar' })
  type: QuestionType;

  @Column({ type: 'jsonb', nullable: true })
  options?: unknown;

  @Column({ type: 'text', nullable: true })
  answer?: string;

  @OneToMany(() => Choice, (choice) => choice.question)
  choices?: Choice[];

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by?: string;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
