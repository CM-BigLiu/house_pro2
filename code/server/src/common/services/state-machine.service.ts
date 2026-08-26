import { Injectable, BadRequestException } from '@nestjs/common';
import { SaleStatus, RoomStatus, BillStatus, InvoiceStatus } from '../enums/status.enum';

type StatusValue = string;
type TransitionMap = Record<string, StatusValue[]>;

const SALE_TRANSITIONS: TransitionMap = {
  [SaleStatus.PRE_PUBLISH]: [SaleStatus.PUBLISHED, SaleStatus.OFF_SHELF],
  [SaleStatus.PUBLISHED]: [SaleStatus.PRICE_NEGOTIATION, SaleStatus.QUICK_SALE, SaleStatus.OFF_SHELF],
  [SaleStatus.PRICE_NEGOTIATION]: [SaleStatus.QUICK_SALE, SaleStatus.SOLD, SaleStatus.PUBLISHED, SaleStatus.OFF_SHELF],
  [SaleStatus.QUICK_SALE]: [SaleStatus.SOLD, SaleStatus.PUBLISHED, SaleStatus.OFF_SHELF],
  [SaleStatus.SOLD]: [SaleStatus.PUBLISHED],
  [SaleStatus.OFF_SHELF]: [SaleStatus.PUBLISHED, SaleStatus.PRE_PUBLISH],
};

const ROOM_TRANSITIONS: TransitionMap = {
  [RoomStatus.VACANT]: [RoomStatus.RESERVED, RoomStatus.RENTED, RoomStatus.CONFIGURING, RoomStatus.REPAIR],
  [RoomStatus.RESERVED]: [RoomStatus.RENTED, RoomStatus.VACANT],
  [RoomStatus.RENTED]: [RoomStatus.CHECKOUT],
  [RoomStatus.CHECKOUT]: [RoomStatus.CONFIGURING, RoomStatus.DIRTY, RoomStatus.REPAIR, RoomStatus.VACANT],
  [RoomStatus.CONFIGURING]: [RoomStatus.DIRTY, RoomStatus.VACANT],
  [RoomStatus.DIRTY]: [RoomStatus.CONFIGURING, RoomStatus.VACANT],
  [RoomStatus.REPAIR]: [RoomStatus.CONFIGURING, RoomStatus.VACANT],
};

const BILL_TRANSITIONS: TransitionMap = {
  [BillStatus.PENDING_RECEIVE]: [BillStatus.DUE, BillStatus.OVERDUE],
  [BillStatus.DUE]: [BillStatus.RECEIVED, BillStatus.OVERDUE],
  [BillStatus.RECEIVED]: [BillStatus.FINAL_REVIEW],
  [BillStatus.FINAL_REVIEW]: [BillStatus.CASHIERED, BillStatus.REFUNDED],
  [BillStatus.OVERDUE]: [BillStatus.RECEIVED, BillStatus.REFUNDED],
  [BillStatus.PENDING_PAY]: [BillStatus.PAID],
};

const INVOICE_TRANSITIONS: TransitionMap = {
  [InvoiceStatus.PENDING]: [InvoiceStatus.PROCESSING, InvoiceStatus.VOIDED],
  [InvoiceStatus.PROCESSING]: [InvoiceStatus.ISSUED, InvoiceStatus.VOIDED],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.RED_FLUSHED, InvoiceStatus.VOIDED],
};

const TRANSITIONS: Record<string, TransitionMap> = {
  sale_property: SALE_TRANSITIONS,
  rental_room: ROOM_TRANSITIONS,
  bill: BILL_TRANSITIONS,
  invoice: INVOICE_TRANSITIONS,
};

@Injectable()
export class StateMachineService {
  canTransition(entityType: string, from: StatusValue, to: StatusValue): boolean {
    const map = TRANSITIONS[entityType];
    if (!map) return true; // unknown entity: permissive
    const allowed = map[from] || [];
    return allowed.includes(to);
  }

  transition(entityType: string, from: StatusValue, to: StatusValue): { success: boolean; message?: string } {
    if (this.canTransition(entityType, from, to)) {
      return { success: true };
    }
    return {
      success: false,
      message: `非法状态流转：${from} -> ${to}`,
    };
  }

  getAllowedTransitions(entityType: string, from: StatusValue): StatusValue[] {
    const map = TRANSITIONS[entityType];
    if (!map) return [];
    return map[from] || [];
  }
}
