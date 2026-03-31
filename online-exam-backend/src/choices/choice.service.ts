import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Choice } from './entities/choice.entity';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { UpdateChoiceDto } from './dto/update-choice.dto';

@Injectable()
export class ChoiceService {
  constructor(
    @InjectRepository(Choice)
    private readonly choiceRepository: Repository<Choice>
  ) {}

  async create(dto: CreateChoiceDto): Promise<Choice> {
    const choice = this.choiceRepository.create(dto);
    return this.choiceRepository.save(choice);
  }

  async findAll(questionId?: string): Promise<Choice[]> {
    const queryBuilder = this.choiceRepository.createQueryBuilder('choice')
      .where('choice.deleted_at IS NULL');

    if (questionId) {
      queryBuilder.andWhere('choice.question_id = :questionId', { questionId });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Choice | null> {
    return this.choiceRepository.findOne({
      where: { id, deleted_at: IsNull() }
    });
  }

  async update(id: string, dto: UpdateChoiceDto): Promise<Choice> {
    const choice = await this.findById(id);
    if (!choice) throw new NotFoundException(`Choice ${id} not found`);

    Object.assign(choice, dto);
    return this.choiceRepository.save(choice);
  }

  async softDelete(id: string, deletedBy: string): Promise<Choice> {
    const choice = await this.findById(id);
    if (!choice) throw new NotFoundException(`Choice ${id} not found`);

    choice.deleted_at = new Date();
    choice.deleted_by = deletedBy;

    return this.choiceRepository.save(choice);
  }
}
