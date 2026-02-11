"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Plane, MessageCircle, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export const QuickDemo = () => {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [currentState, setCurrentState] = useState<'idle' | 'departing' | 'in_flight' | 'landed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);

  const messages = {
    departing: {
      to: "Mom",
      text: "Hey Mom! Just boarded my flight to Paris. Taking off in about 20 minutes. I'll message when I land! ✈️"
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
        return <Plane className="w-5 h-5 text-blue-400" />;
      case 'in_flight':
        return <Plane className="w-5 h-5 text-purple-400 rotate-45" />;
      case 'landed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
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
              {/* Flight header */}
              <div className="bg-gradient-primary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-80">Flight</div>
                    <div className="text-2xl font-bold font-heading">AF1234</div>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold">BUD</div>
                      <div className="text-sm opacity-80">Budapest</div>
                    </div>
                    <Plane className="w-6 h-6" />
                    <div>
                      <div className="text-2xl font-bold">CDG</div>
                      <div className="text-sm opacity-80">Paris</div>
                    </div>
                  </div>
                </div>
              </div>

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
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      {t("demo.instantNotification")}
                    </p>
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
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <Link href={`/${locale}/auth/register`}>
                      <Plane className="w-5 h-5" />
                      {t("demo.setup")}
                    </Link>
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
