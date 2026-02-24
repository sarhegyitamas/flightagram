"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { type ToneType, type CustomizableMessageType, getPresetMessages, interpolateCustomMessage, tonePresets } from "@/lib/messages/presets";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  tone: ToneType;
}

interface CreatedSubscription {
  subscription: {
    id: string;
  };
  flight: Flight;
  receivers: Array<{
    receiver: { id: string; display_name: string };
    opt_in_url: string;
    channel: string;
  }>;
}

const TONE_OPTIONS: { value: ToneType; labelKey: string }[] = [
  { value: "loving", labelKey: "toneLoving" },
  { value: "caring", labelKey: "toneCaring" },
  { value: "simple", labelKey: "toneSimple" },
  { value: "funny", labelKey: "toneFunny" },
];

const MESSAGE_TYPE_LABELS: { type: CustomizableMessageType; labelKey: string }[] = [
  { type: "DEPARTURE", labelKey: "messagePreviewDeparture" },
  { type: "EN_ROUTE", labelKey: "messagePreviewEnRoute" },
  { type: "ARRIVAL", labelKey: "messagePreviewArrival" },
];

export default function CreateSubscriptionPage() {
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [travellerName, setTravellerName] = useState("");
  const [receivers, setReceivers] = useState<Receiver[]>([{ display_name: "", channel: "TELEGRAM", email_address: "", tone: "caring" }]);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [messageNumbers, setMessageNumbers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSubscription | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Per-receiver custom messages state — keyed by receiver index
  const [perReceiverMessages, setPerReceiverMessages] = useState<Record<number, Record<CustomizableMessageType, string>>>({});
  const [messagesInitialized, setMessagesInitialized] = useState(false);
  const [activePreviewReceiver, setActivePreviewReceiver] = useState(0);

  const t = useTranslations("subscription.create");
  const tc = useTranslations("common");
  const router = useRouter();

  // Fetch the logged-in user's display name on mount
  useEffect(() => {
    const fetchUserName = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) {
        setTravellerName(user.user_metadata.display_name as string);
      }
    };
    fetchUserName();
  }, []);

  // Initialize messages section when receivers are filled in
  const hasValidReceiver = receivers.some((r) => r.display_name.trim());
  const validReceiverIndices = receivers.reduce<number[]>((acc, r, i) => {
    if (r.display_name.trim()) acc.push(i);
    return acc;
  }, []);

  // Track previous names so we can regenerate when they change
  const prevTravellerName = useRef(travellerName);
  const prevReceiverNames = useRef<string[]>(receivers.map((r) => r.display_name));

  const generatePreviewForReceiver = (receiverIndex: number, tone: ToneType, msgNum?: number): Record<CustomizableMessageType, string> => {
    const raw = getPresetMessages(tone);
    const num = msgNum ?? (messageNumbers[receiverIndex] || 0);
    const receiverName = receivers[receiverIndex]?.display_name || "";
    const result = {} as Record<CustomizableMessageType, string>;
    for (const type of ["DEPARTURE", "EN_ROUTE", "ARRIVAL"] as CustomizableMessageType[]) {
      result[type] = interpolateCustomMessage(raw[type][num], {
        name: travellerName,
        flight: flightNumber,
        origin: flight?.departure_airport_name || flight?.departure_airport || "",
        destination: flight?.arrival_airport_name || flight?.arrival_airport || "",
        receiver: receiverName,
      });
    }
    return result;
  };

  useEffect(() => {
    if (flight && travellerName && hasValidReceiver && !messagesInitialized) {
      const initial: Record<number, Record<CustomizableMessageType, string>> = {};
      receivers.forEach((r, i) => {
        if (r.display_name.trim()) {
          initial[i] = generatePreviewForReceiver(i, r.tone);
        }
      });
      setPerReceiverMessages(initial);
      setMessagesInitialized(true);
    }
  }, [flight, travellerName, hasValidReceiver, messagesInitialized]);

  // When names change, regenerate messages from presets with current names
  useEffect(() => {
    if (!messagesInitialized) return;
    const oldTraveller = prevTravellerName.current;
    const oldNames = prevReceiverNames.current;
    const newNames = receivers.map((r) => r.display_name);

    let changed = oldTraveller !== travellerName;
    if (!changed) {
      for (let i = 0; i < Math.max(oldNames.length, newNames.length); i++) {
        if ((oldNames[i] || "") !== (newNames[i] || "")) { changed = true; break; }
      }
    }

    if (changed) {
      const updated: Record<number, Record<CustomizableMessageType, string>> = {};
      receivers.forEach((r, i) => {
        if (r.display_name.trim()) {
          updated[i] = generatePreviewForReceiver(i, r.tone);
        }
      });
      setPerReceiverMessages(updated);
    }

    prevTravellerName.current = travellerName;
    prevReceiverNames.current = newNames;
  }, [travellerName, receivers, messagesInitialized]);

  const handleToneChange = (receiverIndex: number, tone: ToneType) => {
    const updated = [...receivers];
    updated[receiverIndex] = { ...updated[receiverIndex], tone };
    setReceivers(updated);
    setPerReceiverMessages((prev) => ({
      ...prev,
      [receiverIndex]: generatePreviewForReceiver(receiverIndex, tone),
    }));
  };

  const handleRegenerateMessages = (receiverIndex: number) => {
    const currentNum = messageNumbers[receiverIndex] || 0;
    const nextNum = currentNum + 1 > 3 ? 0 : currentNum + 1;
    setMessageNumbers((prev) => ({ ...prev, [receiverIndex]: nextNum }));
    setPerReceiverMessages((prev) => ({
      ...prev,
      [receiverIndex]: generatePreviewForReceiver(receiverIndex, receivers[receiverIndex].tone, nextNum),
    }));
  };

  const updateCustomMessage = (receiverIndex: number, type: CustomizableMessageType, value: string) => {
    setPerReceiverMessages((prev) => ({
      ...prev,
      [receiverIndex]: { ...(prev[receiverIndex] || { DEPARTURE: "", EN_ROUTE: "", ARRIVAL: "" }), [type]: value },
    }));
  };

  // Before saving, replace receiver's name with {receiver} placeholder
  const getTemplateMessagesForReceiver = (receiverIndex: number): Record<CustomizableMessageType, string> => {
    const msgs = perReceiverMessages[receiverIndex];
    if (!msgs) return { DEPARTURE: "", EN_ROUTE: "", ARRIVAL: "" };
    const receiverName = receivers[receiverIndex]?.display_name || "";
    const result = {} as Record<CustomizableMessageType, string>;
    for (const type of ["DEPARTURE", "EN_ROUTE", "ARRIVAL"] as CustomizableMessageType[]) {
      result[type] = receiverName
        ? msgs[type].replaceAll(receiverName, "{receiver}")
        : msgs[type];
    }
    return result;
  };

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
      setReceivers([...receivers, { display_name: "", channel: "TELEGRAM", email_address: "", tone: "caring" }]);
    }
  };

  const removeReceiver = (index: number) => {
    setReceivers(receivers.filter((_, i) => i !== index));
    // Clean up per-receiver messages and reindex
    setPerReceiverMessages((prev) => {
      const next: Record<number, Record<CustomizableMessageType, string>> = {};
      let newIdx = 0;
      for (let i = 0; i < receivers.length; i++) {
        if (i === index) continue;
        if (prev[i]) next[newIdx] = prev[i];
        newIdx++;
      }
      return next;
    });
    if (activePreviewReceiver >= receivers.length - 1) {
      setActivePreviewReceiver(Math.max(0, receivers.length - 2));
    }
  };

  const updateReceiverField = (index: number, field: keyof Receiver, value: string) => {
    const updated = [...receivers];
    updated[index] = { ...updated[index], [field]: value };
    setReceivers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flight) return;

    const validReceivers = receivers
      .filter((r) => r.display_name.trim())
      .map((r, filteredIndex) => {
        // Find the original index of this receiver in the full array
        const originalIndex = receivers.findIndex((orig) => orig === r);
        const templateMessages = getTemplateMessagesForReceiver(originalIndex);
        return {
          display_name: r.display_name,
          channel: r.channel,
          ...(r.channel === "EMAIL" && r.email_address ? { email_address: r.email_address } : {}),
          custom_messages: {
            tone: r.tone,
            messages: templateMessages,
          },
        };
      });
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
      <>
        <PageHeader />
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
                {created.receivers.map((receiver, index) => {
                  return (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{receiver.receiver.display_name}</span>
                        <span className="text-xs text-purple-300">
                          {t("telegramLink")}
                        </span>
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
                  )
                })}
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
      </>
    );
  }

  return (
    <>
      <PageHeader />
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all flex items-center justify-between"
                      >
                        <span className={flightDate ? "text-white" : "text-white/40"}>
                          {flightDate ? format(new Date(flightDate + "T12:00:00"), "MMM d, yyyy") : t("flightDate")}
                        </span>
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={flightDate ? new Date(flightDate + "T12:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFlightDate(format(date, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
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

            {/* Receivers Section */}
            {flight && travellerName && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-2">{t("addReceivers")}</h2>
                <p className="text-white/60 text-sm mb-4">{t("addReceiversDesc")}</p>

                <div className="space-y-4">
                  {receivers.map((receiver, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={receiver.display_name}
                          onChange={(e) => updateReceiverField(index, "display_name", e.target.value)}
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
                      {/* Per-Receiver Tone Selector */}
                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1.5">{t("toneLabel")}</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {TONE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleToneChange(index, option.value)}
                              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${receiver.tone === option.value
                                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                                }`}
                            >
                              {tonePresets[option.value].icon} {t(option.labelKey)}
                            </button>
                          ))}
                        </div>
                      </div>
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

            {/* Messages Section — Per-Receiver Tabs */}
            {messagesInitialized && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-2">{t("messagesTitle")}</h2>
                <p className="text-white/60 text-sm mb-4">{t("messagesDesc")}</p>

                {/* Receiver Tabs */}
                {validReceiverIndices.length > 1 && (
                  <div className="flex items-center gap-2 mb-4">
                    {validReceiverIndices.map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewReceiver(idx)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${activePreviewReceiver === idx
                            ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                          }`}
                      >
                        {receivers[idx].display_name || `Receiver ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active receiver's tone indicator + regenerate */}
                {validReceiverIndices.includes(activePreviewReceiver) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/50">{t("toneLabel")}:</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {tonePresets[receivers[activePreviewReceiver].tone].icon} {t(TONE_OPTIONS.find((o) => o.value === receivers[activePreviewReceiver].tone)?.labelKey || "toneCaring")}
                      </span>
                    </div>

                    {/* Regenerate Button */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateMessages(activePreviewReceiver)}
                      className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {t("regenerateMessages")}
                    </button>
                  </div>
                )}

                <p className="text-white/40 text-xs mb-4">{t("messagePreviewEditHint")}</p>

                {/* Message Textareas for active receiver */}
                <div className="space-y-4">
                  {MESSAGE_TYPE_LABELS.map(({ type, labelKey }) => (
                    <div key={type}>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        {t(labelKey)}
                      </label>
                      <textarea
                        value={perReceiverMessages[activePreviewReceiver]?.[type] || ""}
                        onChange={(e) => updateCustomMessage(activePreviewReceiver, type, e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-white/40 text-xs mt-3">{t("messagePreviewPlaceholderNote", { firstReceiver: receivers[activePreviewReceiver]?.display_name || "..." })}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            {flight && travellerName && receivers.some((r) => r.display_name.trim()) && messagesInitialized && (
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
    </>
  );
}
