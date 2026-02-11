/**
 * Flights API Routes
 * GET: Search for flights
 * POST: Create a flight record for subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adbClient } from '@/lib/aerodatabox/client';
import { parseADBFlight } from '@/lib/aerodatabox/mapper';
import { z } from 'zod';
import type { Database } from '@/types/database';

type FlightInsert = Database['public']['Tables']['flights']['Insert'];
type FlightRow = Database['public']['Tables']['flights']['Row'];

// Search request schema
const searchSchema = z.object({
  flight_number: z.string().min(2).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Create flight request schema
const createSchema = z.object({
  flight_number: z.string().min(2).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/flights - Search for flights
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const flightNumber = searchParams.get('flight_number');
    const date = searchParams.get('date');

    const result = searchSchema.safeParse({ flight_number: flightNumber, date });
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Search for flights via AeroDataBox
    const flights = await adbClient.searchFlights(result.data.flight_number, result.data.date);

    // Parse the results
    const parsedFlights = flights.map((f) => parseADBFlight(f));

    return NextResponse.json({ flights: parsedFlights });
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flights - Create/upsert a flight record
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = createSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Get flight data from AeroDataBox
    const adbFlight = await adbClient.getFlightStatus(
      result.data.flight_number,
      result.data.date
    );

    if (!adbFlight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    const flightData = parseADBFlight(adbFlight);
    const adminClient = createAdminClient();

    // Check for existing flight
    const { data: existing } = await adminClient
      .from('flights')
      .select('*')
      .eq('flight_number', result.data.flight_number)
      .gte('scheduled_departure', `${result.data.date}T00:00:00Z`)
      .lte('scheduled_departure', `${result.data.date}T23:59:59Z`)
      .single();

    if (existing) {
      // Update existing flight
      const updateData: Partial<FlightRow> = {
        adb_flight_id: flightData.adb_flight_id,
        airline_iata: flightData.airline_iata,
        airline_name: flightData.airline_name,
        departure_airport: flightData.departure_airport,
        departure_airport_name: flightData.departure_airport_name,
        departure_airport_tz: flightData.departure_airport_tz,
        arrival_airport: flightData.arrival_airport,
        arrival_airport_name: flightData.arrival_airport_name,
        arrival_airport_tz: flightData.arrival_airport_tz,
        scheduled_departure: flightData.scheduled_departure,
        scheduled_arrival: flightData.scheduled_arrival,
        actual_departure: flightData.actual_departure,
        actual_arrival: flightData.actual_arrival,
        estimated_arrival: flightData.estimated_arrival,
        status: flightData.status,
        raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
        status_version: existing.status_version + 1,
      };

      const { data: updated, error: updateError } = await adminClient
        .from('flights')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ flight: updated });
    }

    // Create new flight
    const insertData: FlightInsert = {
      flight_number: flightData.flight_number || result.data.flight_number,
      departure_airport: flightData.departure_airport || 'UNK',
      arrival_airport: flightData.arrival_airport || 'UNK',
      adb_flight_id: flightData.adb_flight_id,
      airline_iata: flightData.airline_iata,
      airline_name: flightData.airline_name,
      departure_airport_name: flightData.departure_airport_name,
      departure_airport_tz: flightData.departure_airport_tz,
      arrival_airport_name: flightData.arrival_airport_name,
      arrival_airport_tz: flightData.arrival_airport_tz,
      scheduled_departure: flightData.scheduled_departure,
      scheduled_arrival: flightData.scheduled_arrival,
      actual_departure: flightData.actual_departure,
      actual_arrival: flightData.actual_arrival,
      estimated_arrival: flightData.estimated_arrival,
      status: flightData.status,
      raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
    };

    const { data: newFlight, error: createError } = await adminClient
      .from('flights')
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ flight: newFlight }, { status: 201 });
  } catch (error) {
    console.error('Flight creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
