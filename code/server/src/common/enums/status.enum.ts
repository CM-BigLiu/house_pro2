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

export enum InvoiceStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ISSUED = 'issued',
  VOIDED = 'voided',
  RED_FLUSHED = 'red_flushed',
}
