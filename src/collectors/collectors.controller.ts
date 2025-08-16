import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CollectorsService } from './collectors.service';

@Controller('collectors')
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) {}

  @Post()
  create(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('phoneNumber') phoneNumber:number,
    @Body('communes') communes: string[],
  ) {
    return this.collectorsService.create(username, password,phoneNumber, communes);
  }

  @Get()
  findAll() {
    return this.collectorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.collectorsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() updateData: { username?: string; password?: string; communes?: string[] },
  ) {
    return this.collectorsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.collectorsService.remove(id);
  }
}
