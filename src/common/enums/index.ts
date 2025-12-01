/**
 * User roles in the Set Aside application
 */
export enum UserRole {
  CUSTOMER = 'customer',
  CASHIER = 'cashier',
  ADMIN = 'admin',
}

/**
 * Order status values following the flow:
 * pending → preparing → ready → pickedup → completed
 */
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKEDUP = 'pickedup',
  COMPLETED = 'completed',
}

/**
 * Valid status transitions (5-stage flow)
 * pending → preparing → ready → pickedup → completed
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.PICKEDUP],
  [OrderStatus.PICKEDUP]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
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
