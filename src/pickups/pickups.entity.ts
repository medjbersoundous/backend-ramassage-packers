import { Entity, Column, PrimaryColumn } from 'typeorm';

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

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ type: 'timestamp'})
  created_at: Date;

  @Column({ type: 'timestamp'})
  updated_at: Date;

  @Column({ type: 'simple-json', nullable: true })
  raw: any;
}
