"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";

interface Subscription {
  id: string;
  traveller_name: string;
  is_active: boolean;
  created_at: string;
  flight: {
    id: string;
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
  };
  receivers: Array<{
    id: string;
    display_name: string;
    opt_in_status: string;
  }>;
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm(t("confirmCancel"))) return;

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
    } catch (err) {
      alert(tc("error"));
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span className="ml-3 text-white/60">{tc("loading")}</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchSubscriptions}
              className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              {tc("tryAgain")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-heading">
              {t("title")}
            </h1>
            <p className="text-white/60 mt-1">{t("subtitle")}</p>
          </div>
          <Link
            href="/subscriptions/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("addFlight")}
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t("noFlights")}</h2>
            <p className="text-white/60 mb-6">{t("noFlightsDesc")}</p>
            <Link
              href="/subscriptions/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("addFlight")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {subscription.flight.flight_number}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          subscription.flight.status
                        )}`}
                      >
                        {t(`status.${subscription.flight.status.toLowerCase()}`)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-white/80 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{subscription.flight.departure_airport}</div>
                          <div className="text-xs text-white/50">{subscription.flight.departure_airport_name}</div>
                        </div>
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{subscription.flight.arrival_airport}</div>
                          <div className="text-xs text-white/50">{subscription.flight.arrival_airport_name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t("departure")}: {formatDateTime(subscription.flight.scheduled_departure)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{subscription.receivers.length} {t("receivers")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/subscriptions/${subscription.id}`}
                      className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all text-center"
                    >
                      {t("viewDetails")}
                    </Link>
                    <button
                      onClick={() => handleCancel(subscription.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
