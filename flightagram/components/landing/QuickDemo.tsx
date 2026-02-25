"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Plane, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { PostcardPreview } from "@/components/postcard/PostcardPreview";

export const QuickDemo = () => {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [currentState, setCurrentState] = useState<'idle' | 'departing' | 'in_flight' | 'landed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);

  const messages = {
    departing: {
      to: "Mom",
      text: "Boarding now from Budapest! I'll message once we're in the air ✈️"
    },
    in_flight: {
      to: "Mom",
      text: "Flying over the Alps right now — the view is incredible! About 1 hour to Paris. See you soon! 🏔️"
    },
    landed: {
      to: "Mom",
      text: "Landed safely in Paris! Just waiting for my luggage. Can't wait to tell you all about it! 💕"
    }
  };

  const playDemo = async () => {
    setIsPlaying(true);

    setCurrentState('departing');
    await new Promise(resolve => setTimeout(resolve, 3000));

    setCurrentState('in_flight');
    await new Promise(resolve => setTimeout(resolve, 3000));

    setCurrentState('landed');
    await new Promise(resolve => setTimeout(resolve, 3000));

    setCurrentState('idle');
    setIsPlaying(false);
  };

  const getStatusIcon = () => {
    switch (currentState) {
      case 'departing':
        return <div className="w-3 h-3 rounded-full transition-all bg-blue-500 animate-pulse" />;
      case 'in_flight':
        return <div className="w-3 h-3 rounded-full transition-all bg-purple-500 animate-pulse" />;
      case 'landed':
        return <div className="w-3 h-3 rounded-full transition-all bg-green-500 animate-pulse" />;
      default:
        return <Plane className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <section id="demo" className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Plane className="w-4 h-4" />
              <span className="text-sm font-medium">{t("demo.badge")}</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-heading">
              {t("demo.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("demo.subtitle")}
            </p>
          </div>

          <Card className="shadow-glow overflow-hidden">
            <CardContent className="p-0">

              {/* Demo content */}
              <div className="p-8 space-y-6">
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-xl">
                  {getStatusIcon()}
                  <span className="font-semibold">
                    {currentState === 'idle' ? t("demo.ready") :
                      currentState === 'in_flight' ? t("demo.inFlight") :
                        currentState === 'departing' ? t("demo.departing") :
                          t("demo.landed")}
                  </span>
                </div>

                {/* Message preview */}
                {currentState !== 'idle' && (
                  <div className="animate-fade-in">
                    <div className="flex items-start gap-3 mb-2">

                      {currentState == 'departing' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center flex-shrink-0">
                            <Send className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">Telegram to {messages[currentState].to}</span>
                              <span className="text-xs text-muted-foreground">Just now</span>
                            </div>
                            <div className="bg-card rounded-2xl rounded-tl-none p-4 border border-border">
                              <p className="text-foreground">
                                {messages[currentState].text}
                              </p>
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                              {t("demo.instantNotification")}
                            </p>
                          </div>
                        </>
                      )
                      }
                      {currentState != 'departing' && (
                        <PostcardPreview
                          type={currentState === 'in_flight' ? 'in_flight' : 'landing'}
                          message={messages[currentState].text}
                          flightNumber="BUD123"
                          origin="Budapest (BUD)"
                          destination="Paris (CDG)"
                          senderName={currentState === 'in_flight' ? 'Anna' : 'Family'}
                          recipientName={currentState === 'in_flight' ? 'Family' : 'Anna'}
                          distance={1245}
                          duration="2h 15m"
                          weather="☀️ 22°C"
                        />
                      )}
                    </div>

                  </div>
                )}

                {/* Idle state */}
                {currentState === 'idle' && !isPlaying && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click &quot;Play Demo&quot; to see how notifications work</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={playDemo}
                    disabled={isPlaying}
                    className="flex-1"
                    size="lg"
                  >
                    <Play className="w-5 h-5" />
                    {t("demo.play")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
