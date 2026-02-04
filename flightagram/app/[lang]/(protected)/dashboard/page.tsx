"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Plane, Clock, Users, ArrowRight, Loader2 } from "lucide-react";

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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      departed: "secondary",
      en_route: "default",
      arrived: "default",
      delayed: "secondary",
      canceled: "destructive",
    };
    return variants[status.toLowerCase()] || "outline";
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{tc("loading")}</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-destructive/10 border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchSubscriptions} variant="outline">
                {tc("tryAgain")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
          <Button asChild variant="hero">
            <Link href="/subscriptions/create">
              <Plus className="w-5 h-5" />
              {t("addFlight")}
            </Link>
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("noFlights")}</h2>
            <p className="text-muted-foreground mb-6">{t("noFlightsDesc")}</p>
            <Button asChild variant="hero">
              <Link href="/subscriptions/create">
                <Plus className="w-5 h-5" />
                {t("addFlight")}
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card
                key={subscription.id}
                className="hover:shadow-glow transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold font-heading">
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

                      <div className="flex items-center gap-6 text-foreground/80 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{subscription.flight.departure_airport}</div>
                            <div className="text-xs text-muted-foreground">{subscription.flight.departure_airport_name}</div>
                          </div>
                          <ArrowRight className="w-6 h-6 text-primary" />
                          <div className="text-center">
                            <div className="text-lg font-semibold">{subscription.flight.arrival_airport}</div>
                            <div className="text-xs text-muted-foreground">{subscription.flight.arrival_airport_name}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{t("departure")}: {formatDateTime(subscription.flight.scheduled_departure)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{subscription.receivers.length} {t("receivers")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/subscriptions/${subscription.id}`}>
                          {t("viewDetails")}
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleCancel(subscription.id)}
                        variant="destructive"
                        size="sm"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
