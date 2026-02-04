"use client";

import { Card } from "@/components/ui/card";
import { Plane, MapPin } from "lucide-react";

interface PostcardPreviewProps {
  type: "in_flight" | "landing";
  message: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  senderName?: string;
  recipientName?: string;
  distance?: number;
  duration?: string;
  weather?: string;
}

export const PostcardPreview = ({
  type,
  message,
  flightNumber,
  origin,
  destination,
  senderName,
  recipientName,
  distance,
  duration,
  weather,
}: PostcardPreviewProps) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-hero shadow-elegant border-0">
      {/* Subtle map texture overlay */}
      <div className="absolute inset-0 bg-map-texture opacity-10" />

      <div className="relative p-8 space-y-6">
        {/* Header with flight line */}
        <div className="flex items-center justify-between text-white/90">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{origin || "Origin"}</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-white/30" />
            <Plane className="w-5 h-5" />
            <div className="h-px flex-1 bg-white/30" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{destination || "Destination"}</span>
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* Data ribbon */}
        {(distance || duration || weather) && (
          <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
            {distance && <span>{distance} km</span>}
            {duration && <span>•</span>}
            {duration && <span>{duration}</span>}
            {weather && <span>•</span>}
            {weather && <span>{weather}</span>}
          </div>
        )}

        {/* Message content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-white text-lg leading-relaxed">
            {message || "Your message will appear here..."}
          </p>
        </div>

        {/* Sender/Recipient info */}
        <div className="flex justify-between items-center text-white/70 text-sm">
          {type === "in_flight" ? (
            <>
              <span>From: {senderName || "Traveler"}</span>
              <span>To: {recipientName || "Family"}</span>
            </>
          ) : (
            <>
              <span>From: {recipientName || "Family"}</span>
              <span>To: {senderName || "Traveler"}</span>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/50 text-xs">Created with Flightagram</p>
          {flightNumber && (
            <p className="text-white/40 text-xs mt-1">Flight {flightNumber}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
