import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Collector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;
  @Column({ unique: true })
  phoneNumber:number;

  @Column('simple-array') 
  communes: string[];

  @Column({ nullable: true })
  fcmToken: string;
  
  @Column({ nullable: true })
  expoPushToken: string;

}
