'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function UnsubscribePage() {
  const t = useTranslations('waitlist');
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'invalid' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    fetch(`/api/unsubscribe?token=${token}`)
      .then(res => res.json())
      .then(data => setStatus(data.success ? 'success' : 'invalid'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex items-start mt-[200px] justify-center p-6 bg-dark">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        {status === 'loading' && <p className="animate-pulse">{t('unsubscribeProcessing')}</p>}
        {status === 'success' && <h1>{t('unsubscribeSuccessful')}</h1>}
        {status === 'invalid' && <h1>{t('invalidToken')}</h1>}
        {status === 'error' && <h1>{t('error')}</h1>}
      </div>
    </div>
  );
}
