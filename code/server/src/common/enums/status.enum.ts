export enum SaleStatus {
  PRE_PUBLISH = 'pre_publish',
  PUBLISHED = 'published',
  PRICE_NEGOTIATION = 'price_negotiation',
  QUICK_SALE = 'quick_sale',
  SOLD = 'sold',
  OFF_SHELF = 'off_shelf',
}

export enum RoomStatus {
  VACANT = 'vacant',
  RESERVED = 'reserved',
  RENTED = 'rented',
  CHECKOUT = 'checkout',
  CONFIGURING = 'configuring',
  DIRTY = 'dirty',
  REPAIR = 'repair',
}

export enum BillStatus {
  PENDING_RECEIVE = 'pending_receive',
  DUE = 'due',
  RECEIVED = 'received',
  FINAL_REVIEW = 'final_review',
  CASHIERED = 'cashiered',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
  PENDING_PAY = 'pending_pay',
  PAID = 'paid',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ISSUED = 'issued',
  VOIDED = 'voided',
  RED_FLUSHED = 'red_flushed',
}
