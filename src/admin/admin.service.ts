import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Admin } from "./admin.entity";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService, 
  ) {}

  async findAll(): Promise<Admin[]> {
    return this.adminRepo.find();
  }

  async findById(id: number): Promise<Admin> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException("Admin not found");
    return admin;
  }

  async create(data: Partial<Admin>): Promise<Admin> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const admin = this.adminRepo.create(data);
    return this.adminRepo.save(admin);
  }

  async update(id: number, data: Partial<Admin>): Promise<Admin> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.adminRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.adminRepo.delete(id);
  }

async login(
  email: string,
  password: string,
): Promise<{ accessToken: string; admin: Partial<Admin> }> {
  const admin = await this.adminRepo.findOne({ where: { email } });
  if (!admin) throw new NotFoundException('Admin not found');

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new UnauthorizedException('Invalid credentials');

  const payload = { sub: admin.id, email: admin.email, role: 'admin' };
  const accessToken = await this.jwtService.signAsync(payload);

  const { password: _, ...adminWithoutPassword } = admin;

  return {
    accessToken,
    admin: {
      ...adminWithoutPassword,
      role: 'admin',
    },
  };
}


}
