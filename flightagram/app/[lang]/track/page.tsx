"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Flight {
  flight_number: string;
  airline_name: string;
  departure_airport: string;
  arrival_airport: string;
  departure_airport_name: string;
  arrival_airport_name: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure: string | null;
  actual_arrival: string | null;
  status: string;
}

export default function TrackFlightPage() {
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [flight, setFlight] = useState<Flight | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("track");
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");

  const searchFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber || !flightDate) return;

    setSearching(true);
    setError(null);
    setFlight(null);

    try {
      const response = await fetch(
        `/api/flights?flight_number=${encodeURIComponent(flightNumber)}&date=${flightDate}`
      );

      if (!response.ok) {
        throw new Error("Flight search failed");
      }

      const data = await response.json();

      if (data.flights && data.flights.length > 0) {
        setFlight(data.flights[0]);
      } else {
        setError("No flight found. Please check the flight number and date.");
      }
    } catch (err) {
      setError("Failed to search for flight. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      departed: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      en_route: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      arrived: "bg-green-500/20 text-green-300 border-green-500/50",
      delayed: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      canceled: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[status.toLowerCase()] || colors.scheduled;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTelegramBotUrl = () => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FlightagramBot";
    return `https://t.me/${botUsername}`;
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-heading mb-4">
            {t("title")}
          </h1>
          <p className="text-white/60 text-lg">{t("subtitle")}</p>
        </div>

        {/* Search Form */}
        <form onSubmit={searchFlight} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <p className="text-white/80 mb-4">{t("enterFlight")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="e.g. UA123"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
            />
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all [color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            disabled={searching || !flightNumber || !flightDate}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {searching ? tc("loading") : t("search")}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Flight Result */}
        {flight && (
          <div className="space-y-6">
            {/* Flight Card */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{flight.flight_number}</h2>
                  <p className="text-white/60">{flight.airline_name}</p>
                </div>
                <span
                  className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(flight.status)}`}
                >
                  {td(`status.${flight.status.toLowerCase()}`)}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between text-white mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">{flight.departure_airport}</div>
                  <div className="text-sm text-white/50 max-w-[120px]">{flight.departure_airport_name}</div>
                </div>
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <div className="mx-4 relative">
                    <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{flight.arrival_airport}</div>
                  <div className="text-sm text-white/50 max-w-[120px]">{flight.arrival_airport_name}</div>
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/50 text-sm mb-1">{td("departure")}</div>
                  <div className="text-white font-semibold">
                    {formatDateTime(flight.actual_departure || flight.scheduled_departure)}
                  </div>
                  {flight.actual_departure && flight.actual_departure !== flight.scheduled_departure && (
                    <div className="text-white/40 text-sm line-through mt-1">
                      {formatDateTime(flight.scheduled_departure)}
                    </div>
                  )}
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/50 text-sm mb-1">{td("arrival")}</div>
                  <div className="text-white font-semibold">
                    {formatDateTime(flight.actual_arrival || flight.scheduled_arrival)}
                  </div>
                  {flight.actual_arrival && flight.actual_arrival !== flight.scheduled_arrival && (
                    <div className="text-white/40 text-sm line-through mt-1">
                      {formatDateTime(flight.scheduled_arrival)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram CTA */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{t("optIn")}</h3>
                  <p className="text-white/60 mb-4">{t("optInDesc")}</p>
                  <a
                    href={getTelegramBotUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0088cc] text-white font-semibold rounded-lg hover:bg-[#0077b5] transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    {t("openTelegram")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!flight && !error && (
          <div className="text-center text-white/40 py-8">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <p>Enter a flight number and date to track</p>
          </div>
        )}
      </div>
    </main>
  );
}
