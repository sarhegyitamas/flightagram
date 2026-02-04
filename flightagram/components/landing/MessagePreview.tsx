import { MessageCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";


export const MessagePreview = () => {
  const t = useTranslations("landing");

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl font-bold">{t("previews.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("previews.subtitle")}
            </p>
          </div>

          <div className="bg-card rounded-3xl shadow-glow p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{t('previews.chatHeader')}</h3>
                <p className="text-sm text-muted-foreground">{t('previews.chatSubtitle')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2].map((num) => (
                <div
                  key={num}
                  className="rounded-2xl p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{t(`previews.sender${num}`) + t('previews.update')}</span>
                    <span className="text-xs text-muted-foreground">{t(`previews.msgTime${num}`)}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{t(`previews.msg${num}`)}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground pt-4">
              {t('previews.yourFamilyWillGetUpdates')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
