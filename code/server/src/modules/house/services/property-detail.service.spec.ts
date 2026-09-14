import { PropertyDetailService } from './property-detail.service';
import { Checkout } from '../entities/checkout.entity';
import { OperationLog } from '../../system/entities/operation-log.entity';

function setup() {
  const find = jest.fn(async () => []);
  const db: any = { getRepository: jest.fn(() => ({ find })) };
  const rental: any = { findSet: jest.fn(async () => ({ id: 2, rooms: [{ id: 101 }, { id: 102 }] })) };
  const sale: any = { findOne: jest.fn(async () => ({ id: 1 })) };
  return { service: new PropertyDetailService(db, rental, sale), db, rental, sale, find };
}
describe('scoped property detail', () => {
  it('checks property scope before querying any history', async () => {
    const ctx = setup(); ctx.rental.findSet.mockRejectedValue(new Error('无权查看'));
    await expect(ctx.service.detail('rent', 2, {} as any)).rejects.toThrow('无权查看');
    expect(ctx.db.getRepository).not.toHaveBeenCalled();
  });
  it('rejects a room belonging to another property', async () => {
    const ctx = setup();
    await expect(ctx.service.detail('rent', 2, {} as any, 999)).rejects.toThrow('不属于');
    expect(ctx.db.getRepository).not.toHaveBeenCalled();
  });
  it('limits checkouts to the selected room and excludes raw audit snapshots', async () => {
    const ctx = setup(); await ctx.service.detail('rent', 2, {} as any, 101);
    expect(ctx.db.getRepository).toHaveBeenCalledWith(Checkout);
    expect(ctx.find).toHaveBeenCalledWith(expect.objectContaining({ where: { rentalSetId: 2, rentalRoomId: 101 } }));
    expect(ctx.db.getRepository).toHaveBeenCalledWith(OperationLog);
    expect(ctx.find).toHaveBeenCalledWith(expect.objectContaining({ select: ['id', 'action', 'employeeId', 'result', 'createdAt'] }));
  });
  it('sale detail never queries rental checkout history', async () => {
    const ctx = setup(); const result = await ctx.service.detail('sale', 1, {} as any);
    expect(result.checkouts).toEqual([]);
    expect(ctx.db.getRepository).not.toHaveBeenCalledWith(Checkout);
  });
});
