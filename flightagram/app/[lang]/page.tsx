import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('homepage');
  return <h1>{t('hello')}</h1>;
}