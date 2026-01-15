/**
 * Message System Types
 */

import type { MessageType, FlightStatus } from '@/types';

/**
 * Context for generating message content
 */
export interface MessageContext {
  traveller_name: string;
  flight_number: string;
  origin: {
    code: string;
    name?: string;
    timezone?: string;
  };
  destination: {
    code: string;
    name?: string;
    timezone?: string;
  };
  times: {
    scheduled_departure?: Date;
    scheduled_arrival?: Date;
    actual_departure?: Date;
    actual_arrival?: Date;
    estimated_arrival?: Date;
  };
  delay_minutes?: number;
}

/**
 * Message schedule entry
 */
export interface MessageSchedule {
  message_type: MessageType;
  scheduled_for: Date;
  idempotency_key: string;
}

/**
 * Map of flight status to which message types should be triggered
 */
export const STATUS_TO_MESSAGE_TYPE: Record<FlightStatus, MessageType | null> = {
  SCHEDULED: null,
  DEPARTED: 'DEPARTURE',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVAL',
  DELAYED: 'DELAY',
  CANCELED: 'CANCELLATION',
};

/**
 * Determine which messages to schedule based on current flight status
 */
export function getMessagesToSchedule(currentStatus: FlightStatus): MessageType[] {
  const lifecycle: MessageType[] = ['DEPARTURE', 'EN_ROUTE', 'ARRIVAL'];

  // If canceled, only send cancellation
  if (currentStatus === 'CANCELED') {
    return ['CANCELLATION'];
  }

  // For scheduled flights, schedule all lifecycle messages
  if (currentStatus === 'SCHEDULED') {
    return lifecycle;
  }

  // For in-progress flights, schedule remaining messages
  const statusIndex = {
    DEPARTED: 1,
    EN_ROUTE: 2,
    ARRIVED: 3,
    DELAYED: 0, // Delays don't affect lifecycle
  };

  const index = statusIndex[currentStatus as keyof typeof statusIndex] ?? 0;
  return lifecycle.slice(index);
}
