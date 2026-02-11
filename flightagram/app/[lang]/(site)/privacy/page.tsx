import { redirect } from 'next/navigation';

export default function PrivacyPage({
  params,
}: {
  params: { lang: 'en' | 'hu' };
}) {
  const { lang } = params;

  if (lang === 'hu') {
    redirect('/assets/docs/Flightagram_Privacy_waitlist_hu.pdf');
  }

  // default: EN
  redirect('/assets/docs/Flightagram_Privacy_waitlist_en.pdf');
}
