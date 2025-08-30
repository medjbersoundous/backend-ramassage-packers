import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Pickup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collectorId: number;

  @Column({ type: 'datetime' })
  date: string;
}
