import type { Database } from '@/types/database';

type FlightRow = Database['public']['Tables']['flights']['Row'];
type ReceiverRow = Database['public']['Tables']['receivers']['Row'];

export interface TravellerRef {
  user_id: string;
}

export interface SubscriptionWithJoins {
  id: string;
  traveller_id: string;
  flight_id: string;
  traveller_name: string;
  is_active: boolean;
  adb_webhook_id: string | null;
  polling_enabled: boolean;
  created_at: string;
  updated_at: string;
  flights: FlightRow;
  travellers?: TravellerRef;
  subscription_receivers: Array<{ receivers: ReceiverRow }>;
}
