import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PickupStatus = 'pending' | 'done' | 'canceled';

@Entity('pickups')
export class PickupEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  partner_id: string;

  @Column({ nullable: true })
  wilaya_id: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  secondary_phone: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'enum', enum: ['pending', 'done', 'canceled'], default: 'pending' })
  status: PickupStatus;

  @Column({ nullable: true })
  assigned_to: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
@Column({ type: 'varchar', length: 255, nullable: true })
partner_name: string | null;


  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'simple-json', nullable: true })
  raw: any;
}
