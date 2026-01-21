import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Collector {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column({ select: false })
  password!: string;
    
  @Column({ unique: true })
  phoneNumber!:number;

  @Column({ type: 'jsonb', nullable: true })
  communes!: string[];

  @Column({ nullable: true })
  fcmToken!: string;
  
  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  expoPushTokens!: string[];

  @Column({ nullable: true })
  generalAccessToken?: string;


  @Column({ nullable: true })
  generalRefreshToken?: string;

  @Column({ type: 'bigint', nullable: true })
  generalTokenExpiresAt?: number; 
}
