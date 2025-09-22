import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("admins")
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string; 

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: "ADMIN" })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
