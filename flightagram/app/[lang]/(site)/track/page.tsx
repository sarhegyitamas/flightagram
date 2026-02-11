"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Search, Loader2, Send } from "lucide-react";

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

      console.log(data);
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Plane className="w-4 h-4" />
            <span className="text-sm font-medium">{t("flightStatus")}</span>
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={searchFlight}>
              <p className="text-foreground/80 mb-4">{t("enterFlight")}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. UA123"
                />
                <Input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="[color-scheme:dark]"
                />
              </div>

              <Button
                type="submit"
                disabled={searching || !flightNumber || !flightDate}
                className="w-full"
                variant="hero"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {tc("loading")}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t("search")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-8 bg-destructive/10 border-destructive/50">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Flight Result */}
        {flight && (
          <div className="space-y-6">
            {/* Flight Card */}
            <Card className="shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-heading">{flight.flight_number}</h2>
                    <p className="text-muted-foreground">{flight.airline_name}</p>
                  </div>
                  <span
                    className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(flight.status)}`}
                  >
                    {td(`status.${flight.status.toLowerCase()}`)}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{flight.departure_airport}</div>
                    <div className="text-sm text-muted-foreground max-w-[120px]">{flight.departure_airport_name}</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="h-px bg-border flex-1"></div>
                    <div className="mx-4">
                      <Plane className="w-8 h-8 text-primary" />
                    </div>
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{flight.arrival_airport}</div>
                    <div className="text-sm text-muted-foreground max-w-[120px]">{flight.arrival_airport_name}</div>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-muted-foreground text-sm mb-1">{td("departure")}</div>
                    <div className="font-semibold">
                      {formatDateTime(flight.actual_departure || flight.scheduled_departure)}
                    </div>
                    {flight.actual_departure && flight.actual_departure !== flight.scheduled_departure && (
                      <div className="text-muted-foreground/60 text-sm line-through mt-1">
                        {formatDateTime(flight.scheduled_departure)}
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-muted-foreground text-sm mb-1">{td("arrival")}</div>
                    <div className="font-semibold">
                      {formatDateTime(flight.actual_arrival || flight.scheduled_arrival)}
                    </div>
                    {flight.actual_arrival && flight.actual_arrival !== flight.scheduled_arrival && (
                      <div className="text-muted-foreground/60 text-sm line-through mt-1">
                        {formatDateTime(flight.scheduled_arrival)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telegram CTA */}
            <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center flex-shrink-0">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{t("optIn")}</h3>
                    <p className="text-muted-foreground mb-4">{t("optInDesc")}</p>
                    <a
                      href={getTelegramBotUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0088cc] text-white font-semibold rounded-xl hover:bg-[#0077b5] transition-all"
                    >
                      <Send className="w-5 h-5" />
                      {t("openTelegram")}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!flight && !error && (
          <div className="text-center text-muted-foreground py-12">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 opacity-50" />
            </div>
            <p>Enter a flight number and date to track</p>
          </div>
        )}
      </div>
    </main>
  );
}
