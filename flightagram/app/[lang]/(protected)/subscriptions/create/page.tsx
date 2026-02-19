"use client";

import { useState } from "react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";

interface Flight {
  id?: string;
  flight_number: string;
  airline_name: string;
  departure_airport: string;
  arrival_airport: string;
  departure_airport_name: string;
  arrival_airport_name: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
}

interface Receiver {
  display_name: string;
  channel: "TELEGRAM" | "EMAIL";
  email_address: string;
}

interface CreatedSubscription {
  subscription: {
    id: string;
  };
  flight: Flight;
  receivers: Array<{
    id: string;
    display_name: string;
    opt_in_url: string;
    channel: string;
  }>;
}

export default function CreateSubscriptionPage() {
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [travellerName, setTravellerName] = useState("");
  const [receivers, setReceivers] = useState<Receiver[]>([{ display_name: "", channel: "TELEGRAM", email_address: "" }]);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSubscription | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const t = useTranslations("subscription.create");
  const tc = useTranslations("common");
  const router = useRouter();

  const searchFlight = async () => {
    if (!flightNumber || !flightDate) return;

    setSearching(true);
    setSearchError(null);
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
        setSearchError(t("noFlightFound"));
      }
    } catch (err) {
      setSearchError(t("noFlightFound"));
    } finally {
      setSearching(false);
    }
  };

  const addReceiver = () => {
    if (receivers.length < 3) {
      setReceivers([...receivers, { display_name: "", channel: "TELEGRAM", email_address: "" }]);
    }
  };

  const removeReceiver = (index: number) => {
    setReceivers(receivers.filter((_, i) => i !== index));
  };

  const updateReceiverField = (index: number, field: keyof Receiver, value: string) => {
    const updated = [...receivers];
    updated[index] = { ...updated[index], [field]: value };
    setReceivers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flight || !travellerName) return;

    const validReceivers = receivers
      .filter((r) => r.display_name.trim())
      .map((r) => ({
        display_name: r.display_name,
        channel: r.channel,
        ...(r.channel === "EMAIL" && r.email_address ? { email_address: r.email_address } : {}),
      }));
    if (validReceivers.length === 0) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flight_number: flightNumber,
          flight_date: flightDate,
          traveller_name: travellerName,
          receivers: validReceivers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create subscription");
      }

      const data = await response.json();
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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

  if (created) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white font-heading mb-2">
                {t("success")}
              </h1>
              <p className="text-white/60">{t("successDesc")}</p>
            </div>

            <div className="space-y-4 mb-8">
              {created.receivers.map((receiver, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{receiver.display_name}</span>
                    <span className="text-xs text-purple-300">{t("telegramLink")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={receiver.opt_in_url}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(receiver.opt_in_url, index)}
                      className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all border border-purple-500/30 text-sm whitespace-nowrap"
                    >
                      {copiedIndex === index ? t("copied") : t("copyLink")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="block w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:opacity-90 text-center transition-all"
            >
              {t("goToDashboard")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-heading">{t("title")}</h1>
          <p className="text-white/60 mt-1">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Flight Search Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">{t("flightNumber")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {t("flightNumber")}
                </label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder={t("flightNumberPlaceholder")}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {t("flightDate")}
                </label>
                <input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={searchFlight}
              disabled={searching || !flightNumber || !flightDate}
              className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {searching ? t("searching") : t("searchFlight")}
            </button>

            {searchError && (
              <p className="mt-3 text-red-300 text-sm">{searchError}</p>
            )}

            {flight && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-green-300">{t("flightFound")}</span>
                </div>

                <div className="flex items-center justify-between text-white mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold">{flight.departure_airport}</div>
                    <div className="text-xs text-white/50">{flight.departure_airport_name}</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-px bg-white/20 flex-1 mx-4"></div>
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <div className="h-px bg-white/20 flex-1 mx-4"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{flight.arrival_airport}</div>
                    <div className="text-xs text-white/50">{flight.arrival_airport_name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">{t("scheduledDeparture")}</span>
                    <div className="text-white">{formatDateTime(flight.scheduled_departure)}</div>
                  </div>
                  <div>
                    <span className="text-white/50">{t("scheduledArrival")}</span>
                    <div className="text-white">{formatDateTime(flight.scheduled_arrival)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Traveller Name Section */}
          {flight && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">{t("yourName")}</h2>
              <input
                type="text"
                value={travellerName}
                onChange={(e) => setTravellerName(e.target.value)}
                placeholder={t("yourNamePlaceholder")}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
              />
            </div>
          )}

          {/* Receivers Section */}
          {flight && travellerName && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-2">{t("addReceivers")}</h2>
              <p className="text-white/60 text-sm mb-4">{t("addReceiversDesc")}</p>

              <div className="space-y-3">
                {receivers.map((receiver, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={receiver.display_name}
                      onChange={(e) => updateReceiver(index, e.target.value)}
                      placeholder={t("receiverNamePlaceholder")}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                    />
                    {receivers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReceiver(index)}
                        className="px-3 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {receivers.length < 3 && (
                <button
                  type="button"
                  onClick={addReceiver}
                  className="mt-3 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("addReceiver")}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          {flight && travellerName && receivers.some((r) => r.display_name.trim()) && (
            <button
              type="submit"
              disabled={creating}
              className="w-full py-4 px-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {creating ? t("creating") : t("createSubscription")}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
