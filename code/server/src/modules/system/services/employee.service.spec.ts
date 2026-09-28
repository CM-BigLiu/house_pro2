import { EmployeeService } from './employee.service';

function setup() {
  const employee: any = { id: 3, managerId: null, password: 'stored-hash', roles: [{ id: 7, code: 'salesman' }], stores: [{ id: 1 }], positions: [] };
  const repo: any = { findOne: jest.fn(async () => employee), save: jest.fn(async value => value) };
  const service = new EmployeeService(repo, { find: async () => [] } as any, { find: async () => [] } as any, { find: async () => [] } as any);
  jest.spyOn(service, 'managerOptions').mockResolvedValue([{ id: 2, name: '同门店店长', storeIds: [1] }, { id: 4, name: '其他门店店长', storeIds: [2] }]);
  return { service, repo, employee };
}
describe('业务员归属店长', () => {
  it('指定同门店店长并保留角色、门店和密码；返回内容不包含密码', async () => {
    const t = setup(); const saved = await t.service.update(3, { managerId: 2 });
    expect(saved).toMatchObject({ id: 3, managerId: 2, roles: t.employee.roles, stores: t.employee.stores });
    expect(saved).not.toHaveProperty('password');
    expect(t.repo.save.mock.calls[0][0].password).toBe('stored-hash');
  });
  it.each([3, 4, 99, -1, 1.5])('拒绝本人、跨门店、无效或停用店长 %s', async managerId => {
    const t = setup(); await expect(t.service.update(3, { managerId })).rejects.toMatchObject({ status: 400 });
    expect(t.repo.save).not.toHaveBeenCalled();
  });
  it('允许清除归属，未提交该字段时保留原归属', async () => {
    const t = setup(); t.employee.managerId = 2;
    expect((await t.service.update(3, { name: '业务员' })).managerId).toBe(2);
    expect((await t.service.update(3, { managerId: null })).managerId).toBeNull();
  });
  it('非业务角色不能指定店长', async () => {
    const t = setup(); t.employee.roles = [{ code: 'finance_clerk' }];
    await expect(t.service.update(3, { managerId: 2 })).rejects.toThrow('适用于业务员');
  });
});
