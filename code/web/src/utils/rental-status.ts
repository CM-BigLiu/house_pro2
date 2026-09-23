type RentalStatusSet = {
  bizType: string;
  status: string;
  rooms?: { status: string }[];
};

export function hasRentalOccupancy(set: RentalStatusSet, status: 'vacant' | 'rented'): boolean {
  if (set.bizType === 'shared') return set.rooms?.some(room => room.status === status) ?? false;
  return status === 'vacant'
    ? ['active', 'vacant'].includes(set.status)
    : set.status === 'rented';
}
