import { Controller, Get, Post, Body, Param, Put, Delete } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Admin } from "./admin.entity";

@Controller("admins")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll(): Promise<Admin[]> {
    return this.adminService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: number): Promise<Admin> {
    return this.adminService.findById(id);
  }

  @Post()
  create(@Body() data: Partial<Admin>): Promise<Admin> {
    return this.adminService.create(data);
  }

  @Put(":id")
  update(@Param("id") id: number, @Body() data: Partial<Admin>): Promise<Admin> {
    return this.adminService.update(id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: number): Promise<void> {
    return this.adminService.remove(id);
  }

 @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
  }
}
