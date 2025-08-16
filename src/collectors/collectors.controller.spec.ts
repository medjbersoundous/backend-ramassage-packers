import { Test, TestingModule } from '@nestjs/testing';
import { CollectorsController } from './collectors.controller';

describe('CollectorsController', () => {
  let controller: CollectorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectorsController],
    }).compile();

    controller = module.get<CollectorsController>(CollectorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
