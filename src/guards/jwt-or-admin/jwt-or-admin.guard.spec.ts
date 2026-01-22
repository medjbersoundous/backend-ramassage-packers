import { JwtOrAdminGuard } from './jwt-or-admin.guard';

describe('JwtOrAdminGuard', () => {
  it('should be defined', () => {
    expect(new JwtOrAdminGuard()).toBeDefined();
  });
});
