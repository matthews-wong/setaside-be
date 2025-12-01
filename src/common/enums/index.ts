/**
 * User roles in the Set Aside application
 */
export enum UserRole {
  CUSTOMER = 'customer',
  CASHIER = 'cashier',
  ADMIN = 'admin',
}

/**
 * Order status values following the simplified flow:
 * pending → ready (2-stage flow)
 * Also supports: pending → preparing → ready → picked_up (legacy 4-stage flow)
 */
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
}

/**
 * Valid status transitions
 * Supports both simplified (pending → ready) and full flow
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.READY],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
