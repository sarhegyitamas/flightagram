"use client";
import React from 'react';
import { Logo } from '@/components/Logo';
import { useTranslations } from 'next-intl';

const Header = ({ setShowModal, scrollToSection }) => {
	const t = useTranslations('waitlist');

	return (
		<section className="py-20 bg-gradient-hero text-white text-shadow-lg">
			<div className="flex flex-col max-w-[50vw] mx-auto items-center text-center">
				<Logo size="lg" showText={false} white={true} />
				<h1
					className="text-4xl md:text-7xl font-space-grotesk font-bold my-10"
					dangerouslySetInnerHTML={{ __html: t('title') }}
				></h1>
				<p
					className="max-w-2xl mb-8 text-xl md:text-2xl"
					dangerouslySetInnerHTML={{ __html: t('description') }}
				></p>
				<div className="flex gap-4 my-6">
					<button
						className="bg-dark text-white text-md md:text-xl px-6 py-2 rounded-lg shadow hover:opacity-80"
						onClick={() => setShowModal(true)}
					>
						{t('joinWaitlist')}
					</button>
					<button
						className="border border-dark px-6 py-2 text-md md:text-xl rounded-lg hover:bg-dark hover:opacity-80 hover:text-white"
						onClick={() => scrollToSection('problem')}
					>
						{t('learnMore')}
					</button>
				</div>
			</div>
		</section>
	);
};

export default Header;
