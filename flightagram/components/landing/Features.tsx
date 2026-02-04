"use client";

import { Plane, Users, Bell } from "lucide-react";
import { useTranslations } from "next-intl";

export const Features = () => {
  const t = useTranslations("landing");

  const features = [
    {
      icon: Plane,
      title: t("features.title1"),
      description: t("features.body1"),
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: Users,
      title: t("features.title2"),
      description: t("features.body2"),
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Bell,
      title: t("features.title3"),
      description: t("features.body3"),
      color: "from-pink-500/20 to-orange-500/20"
    }
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold font-heading">
            {t("features.headline")}{" "}
            <span className="text-gradient">
              {t("features.highlight")}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all group border border-border"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-heading">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
