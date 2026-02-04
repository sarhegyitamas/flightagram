"use client";
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function Modal({ setShowModal }) {
	const t = useTranslations('waitlist');

	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [firstname, setFirstName] = useState('');
	const [lastname, setLastName] = useState('');
	const [error, setError] = useState('');
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [destination, setDestination] = useState('');
	const [channels, setChannels] = useState([]);
	const [nextFlightTime, setNextFlighttime] = useState('');
	const [success, setSuccess] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const nextFlightOptions = ['this_month', 'next_3_months', 'this_year', 'not_sure'];
	const channelOptions = ['WhatsApp', 'Telegram', 'Viber', 'Email', 'SMS'];

	const toggleChannel = (option) => {
		setChannels((prev) => (prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]));
	};

	const renderStepBar = () => {
		return (
			<div className="flex justify-center gap-2 mt-2 mb-6">
				{[1, 2, 3].map((s) => (
					<div
						key={s}
						className={`h-1 w-10 rounded-full transition-all ${step >= s ? 'bg-dark' : 'bg-dark/30'}`}
					></div>
				))}
			</div>
		);
	};

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(String(email).toLowerCase());
	};

	const closeModal = () => {
		setShowModal(false);
		setStep(1);
		setEmail('');
		setFirstName('');
		setLastName('');
		setTermsAccepted(false);
		setDestination('');
		setChannels([]);
		setNextFlighttime('');
		setError('');
		setSuccess(false);
		setIsSubmitting(false);
	};

	const handleFirstStep = async (e) => {
		e.preventDefault();
		if (!validateEmail(email)) {
			setError(t('inputValidEmail'));
			setSuccess(false);
			return;
		}

		setError('');
		setIsSubmitting(true);
		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, firstname, lastname }),
			});
			if (res.status == 409) {
				setStep(2);
				setIsSubmitting(false);
				return;
			}
			// trigger welcome email
			await fetch('/api/waitlist-welcome', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			setStep(2);
			setError('');
		} catch (err) {
			setError(t('error'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFinalSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			await fetch('/api/waitlist', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					destination,
					nextFlightTime,
					channels,
				}),
			});
			setSuccess(true);
			setStep(4);
		} catch (err) {
			setError(t('error'));
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		if (step === 4) {
			setTimeout(() => {
				closeModal();
			}, 4500);
		}
	}, [step]);

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
			<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
				<button className="absolute top-3 right-3" onClick={closeModal}>
					✕
				</button>

				{/* Progress Bar */}
				{renderStepBar()}

				{/* STEP 1 */}
				{step === 1 && (
					<>
						<h3 className="text-2xl font-semibold mb-4 text-center">{t('popup1Title')}</h3>
						<p className="text-sm text-center mb-6">{t('popup1Subtitle')}</p>

						<form onSubmit={handleFirstStep} className="flex flex-col gap-4">
							<input
								type="email"
								placeholder={t('popup1Placeholder')}
								className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={success}
							/>
							<input
								type="firstname"
								placeholder={t('popup1FirstName')}
								className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black"
								value={firstname}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={success}
							/>
							<input
								type="lastname"
								placeholder={t('popup1LastName')}
								className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black"
								value={lastname}
								onChange={(e) => setLastName(e.target.value)}
								disabled={success}
							/>

							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									className="accent-dark"
									checked={termsAccepted}
									onChange={(e) => setTermsAccepted(e.target.checked)}
								/>

								{t('popup1Consent')}
							</label>

							{error && <p className="text-red-600 text-sm text-center">{error}</p>}

							<button
								type="submit"
								disabled={!termsAccepted || email.trim() === ''}
								className={`py-2 rounded-lg text-white transition ${
									isSubmitting || success ? 'bg-dark/40 cursor-not-allowed' : 'bg-dark hover:bg-dark/80'
								} disabled:bg-gray-400`}
							>
								{isSubmitting ? t('submitting') : t('popup1CTA')}
							</button>
						</form>
					</>
				)}

				{step === 2 && (
					<>
						<h3 className="text-xl font-semibold mb-4 text-center">{t('popup2Title')}</h3>

						<form onSubmit={() => setStep(3)} className="flex flex-col gap-4">
							<input
								type="text"
								placeholder={t('popup2Placeholder')}
								className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black"
								value={destination}
								onChange={(e) => setDestination(e.target.value)}
							/>
							<p className="text-xs color-dark/40">{t('popup2Subtitle')}</p>

							<button type="submit" className="py-2 rounded-lg bg-dark hover:bg-dark/90 text-white">
								{t('popup2CTA')}
							</button>
						</form>
					</>
				)}

				{step === 3 && (
					<>
						<form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
							<label className="text-center font-bold">{t('popup3Title')}</label>
							<label className="text-center text-sm text-dark/70">{t('popup3Subtitle')}</label>
							{channelOptions.map((opt) => (
								<label key={opt} className="flex items-center gap-1 rounded-lg cursor-pointer">
									<input
										type="checkbox"
										className="h-4 w-4 accent-dark"
										checked={channels.includes(opt)}
										onChange={() => toggleChannel(opt)}
									/>
									<span>{opt}</span>
								</label>
							))}
							<label className="text-center font-bold">{t('popup3DateLabel')}</label>
							<select
								value={nextFlightTime}
								onChange={(e) => setNextFlighttime(e.target.value)}
								className="border border-dark rounded-lg p-2"
							>
								<option value="">{t('popup3Date0')}</option>
								{nextFlightOptions.map((option, i) => (
									<option key={option} value={option}>
										{t(`popup3Date${i + 1}`)}
									</option>
								))}
							</select>
							<button
								type="submit"
								disabled={isSubmitting || success}
								className={`py-2 rounded-lg text-white transition ${
									isSubmitting || success ? 'bg-dark/40 cursor-not-allowed' : 'bg-dark hover:opacity-90'
								}`}
							>
								{isSubmitting ? t('submitting') : t('popup3CTA')}
							</button>
						</form>
					</>
				)}

				{step === 4 && (
					<>
						<p className="text-center font-bold pt-3 pb-5">{t('popupSuccessTitle')}</p>
						<p className="text-center text-sm text-dark/70">{t('popupSuccessSubtitle')}</p>
					</>
				)}
			</div>
		</div>
	);
}
