"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { use } from "react";
import PageHeader from "@/components/PageHeader";

const TONE_LABELS: Record<string, { icon: string; label: string }> = {
  loving: { icon: "\u2764\uFE0F", label: "Loving" },
  caring: { icon: "\uD83D\uDC9C", label: "Caring" },
  simple: { icon: "\u2709\uFE0F", label: "Simple" },
  funny: { icon: "\uD83D\uDE04", label: "Funny" },
};

interface SubscriptionDetails {
  subscription: {
    id: string;
    traveller_name: string;
    is_active: boolean;
    created_at: string;
  };
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
    channel: string;
    opt_in_status: string;
    opt_in_url: string;
    tone: string | null;
    custom_messages: { tone: string; messages: Record<string, string> } | null;
  }>;
  messages: Array<{
    id: string;
    message_type: string;
    status: string;
    scheduled_for: string;
    sent_at: string | null;
    receiver_id: string;
  }>;
}

export default function SubscriptionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingReceiver, setAddingReceiver] = useState(false);
  const [newReceiverName, setNewReceiverName] = useState("");
  const [newReceiverChannel, setNewReceiverChannel] = useState<"TELEGRAM" | "EMAIL">("TELEGRAM");
  const [newReceiverEmail, setNewReceiverEmail] = useState("");
  const [showAddReceiver, setShowAddReceiver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);

  const t = useTranslations("subscription.details");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const router = useRouter();

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch subscription details");
      }
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceiverName.trim()) return;

    setAddingReceiver(true);
    try {
      const body: Record<string, string> = {
        display_name: newReceiverName,
        channel: newReceiverChannel,
      };
      if (newReceiverChannel === "EMAIL" && newReceiverEmail) {
        body.email_address = newReceiverEmail;
      }

      const response = await fetch(`/api/subscriptions/${id}/receivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to add receiver");
      }

      setNewReceiverName("");
      setNewReceiverChannel("TELEGRAM");
      setNewReceiverEmail("");
      setShowAddReceiver(false);
      fetchDetails();
    } catch (err) {
      alert(tc("error"));
    } finally {
      setAddingReceiver(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(td("confirmCancel"))) return;

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
      router.push("/dashboard");
    } catch (err) {
      alert(tc("error"));
    }
  };

  const copyToClipboard = async (text: string, receiverId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(receiverId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveMessage = async (receiverId: string, messageType: string) => {
    setSavingMessage(true);
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId,
          message_type: messageType,
          message: editingValue,
        }),
      });
      if (!response.ok) throw new Error("Failed to update message");
      setEditingKey(null);
      fetchDetails();
    } catch {
      alert(tc("error"));
    } finally {
      setSavingMessage(false);
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

  const getOptInStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300",
      active: "bg-green-500/20 text-green-300",
      unsubscribed: "bg-gray-500/20 text-gray-300",
    };
    return colors[status.toLowerCase()] || colors.pending;
  };

  const getMessageStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300",
      scheduled: "bg-blue-500/20 text-blue-300",
      sent: "bg-green-500/20 text-green-300",
      failed: "bg-red-500/20 text-red-300",
      skipped: "bg-gray-500/20 text-gray-300",
    };
    return colors[status.toLowerCase()] || colors.pending;
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

  if (error || !data) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-300">{error || tc("error")}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              {tc("back")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { subscription, flight, receivers, messages } = data;

  return (
    <>
      <PageHeader />
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white font-heading">
                {flight.flight_number}
              </h1>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
            >
              {t("cancelSubscription")}
            </button>
          </div>

          {/* Flight Info Card */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t("flightInfo")}</h2>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(flight.status)}`}
              >
                {td(`status.${flight.status.toLowerCase()}`)}
              </span>
            </div>

            <div className="flex items-center justify-between text-white mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{flight.departure_airport}</div>
                <div className="text-sm text-white/50">{flight.departure_airport_name}</div>
              </div>
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="h-px bg-white/20 flex-1"></div>
                <svg className="w-8 h-8 text-purple-400 mx-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{flight.arrival_airport}</div>
                <div className="text-sm text-white/50">{flight.arrival_airport_name}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-white/50 text-sm">{td("departure")}</span>
                <div className="text-white font-medium">
                  {formatDateTime(flight.actual_departure || flight.scheduled_departure)}
                </div>
              </div>
              <div>
                <span className="text-white/50 text-sm">{td("arrival")}</span>
                <div className="text-white font-medium">
                  {formatDateTime(flight.actual_arrival || flight.scheduled_arrival)}
                </div>
              </div>
            </div>
          </div>

          {/* Receivers Card */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t("receiversTitle")}</h2>
              {receivers.length < 3 && (
                <button
                  onClick={() => setShowAddReceiver(true)}
                  className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-sm rounded-lg hover:bg-purple-500/30 transition-all flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("addReceiver")}
                </button>
              )}
            </div>

            {showAddReceiver && (
              <form onSubmit={handleAddReceiver} className="mb-4 p-4 bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newReceiverName}
                    onChange={(e) => setNewReceiverName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  />
                  <button
                    type="submit"
                    disabled={addingReceiver}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-all"
                  >
                    {addingReceiver ? "..." : tc("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddReceiver(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                  >
                    {tc("close")}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {receivers.map((receiver) => (
                <div
                  key={receiver.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-300 font-medium">
                        {receiver.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{receiver.display_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                          {receiver.channel === "EMAIL" ? "Email" : "Telegram"}
                        </span>
                        {receiver.tone && TONE_LABELS[receiver.tone] && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            {TONE_LABELS[receiver.tone].icon} {TONE_LABELS[receiver.tone].label}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getOptInStatusColor(receiver.opt_in_status)}`}
                      >
                        {t(`optInStatus.${receiver.opt_in_status.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                  {receiver.opt_in_status === "PENDING" && (
                    <button
                      onClick={() => copyToClipboard(receiver.opt_in_url, receiver.id)}
                      className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all"
                    >
                      {copiedId === receiver.id ? "Copied!" : "Copy Link"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages Card */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">{t("messagesTitle")}</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/50 text-sm">
                    <th className="pb-3">{t("receiver")}</th>
                    <th className="pb-3">{t("type")}</th>
                    <th className="pb-3">{t("scheduledFor")}</th>
                    <th className="pb-3">{t("status")}</th>
                    <th className="pb-3">{t("message")}</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {(() => {
                    const CUSTOMIZABLE_TYPES = ["DEPARTURE", "EN_ROUTE", "ARRIVAL"] as const;
                    // Build a set of existing message keys (receiver_id:message_type)
                    const existingKeys = new Set(
                      messages.map((m) => `${m.receiver_id}:${m.message_type}`)
                    );
                    // Build rows from custom_messages templates that don't have a messages row yet
                    const templateRows = receivers.flatMap((receiver) => {
                      if (!receiver.custom_messages?.messages) return [];
                      return CUSTOMIZABLE_TYPES
                        .filter((type) => !existingKeys.has(`${receiver.id}:${type}`))
                        .map((type) => ({
                          key: `template:${receiver.id}:${type}`,
                          receiver_id: receiver.id,
                          message_type: type,
                          scheduled_for: null as string | null,
                          status: "scheduled",
                        }));
                    });
                    const allRows = [
                      ...messages.map((m) => ({
                        key: m.id,
                        receiver_id: m.receiver_id,
                        message_type: m.message_type,
                        scheduled_for: m.scheduled_for as string | null,
                        status: m.status,
                      })),
                      ...templateRows,
                    ];

                    return allRows.map((row) => {
                      const receiver = receivers.find((r) => r.id === row.receiver_id);
                      const isCustomizable = CUSTOMIZABLE_TYPES.includes(
                        row.message_type as (typeof CUSTOMIZABLE_TYPES)[number]
                      );
                      const rawCustomMsg = receiver?.custom_messages?.messages?.[row.message_type] || "";
                      const customMsg = rawCustomMsg.replace(/\{receiver\}/g, receiver?.display_name || "");
                      const rowKey = `${row.receiver_id}:${row.message_type}`;
                      const isEditing = editingKey === rowKey;

                      return (
                        <tr key={row.key} className="border-t border-white/10">
                          <td className="py-3">{receiver?.display_name || "Unknown"}</td>
                          <td className="py-3">
                            {t(`messageType.${row.message_type.toLowerCase()}`)}
                          </td>
                          <td className="py-3 text-white/70">
                            {row.scheduled_for ? formatDateTime(row.scheduled_for) : "-"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getMessageStatusColor(row.status)}`}
                            >
                              {t(`messageStatus.${row.status.toLowerCase()}`)}
                            </span>
                          </td>
                          <td className="py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveMessage(row.receiver_id, row.message_type);
                                    if (e.key === "Escape") setEditingKey(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveMessage(row.receiver_id, row.message_type)}
                                  disabled={savingMessage}
                                  className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="p-1 text-white/40 hover:text-white/60"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-white/70 text-sm truncate max-w-[200px]">
                                  {customMsg || (isCustomizable ? "-" : "")}
                                </span>
                                {isCustomizable && (
                                  <button
                                    onClick={() => {
                                      setEditingKey(rowKey);
                                      setEditingValue(rawCustomMsg);
                                    }}
                                    className="p-1 text-white/30 hover:text-purple-400 transition-colors flex-shrink-0"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
