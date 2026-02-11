'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import SampleMessage from '@/components/SampleMessage';
import Footer from '@/components/Footer';
import { generateContent, generateContentForPrivacy } from '@/lib/generateContent';

export default function WaitlistPage() {
    const t = useTranslations('waitlist');
    const lang = useLocale();
    const [showModal, setShowModal] = useState(false);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    const sections = [
        {
            name: 'problem',
            classBg: 'bg-white',
            classFont: 'text-dark-font',
            innerContent: generateContent('problem', 'text-dark-font', 'bg-white', t),
        },
        {
            name: 'solution',
            classBg: 'bg-dark',
            classFont: 'text-white',
            innerContent: generateContent('solution', 'text-white', 'bg-dark', t),
        },
        {
            name: 'how',
            classBg: 'bg-white',
            classFont: 'text-dark-font',
            innerContent: (
                <div className={`text-dark-font grid md:grid-cols-3 gap-8 max-w-5xl mx-auto`}>
                    {[1, 2, 3].map((point, i) => {
                        return (
                            <div key={point} className="space-y-5">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl transition-all duration-300 hover:scale-110"
                                    style={{
                                        background: 'linear-gradient(135deg, #C6A4FF 0%, #FF8EC7 100%)',
                                        boxShadow: '0 4px 20px rgba(198, 164, 255, 0.4)',
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <h3 className="text-2xl font-bold min-h-20" style={{ color: '#C6A4FF' }}>
                                    {t(`howTitle${point}`)}
                                </h3>
                                <div
                                    className={`text-dark-font bg-white/10 p-6 rounded-xl text-base/8 transition-all duration-300 hover:scale-105`}
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(198, 164, 255, 0.2) 0%, rgba(255, 142, 199, 0.2) 100%)',
                                        boxShadow: 'rgba(198, 164, 255, 0.15) 0px 4px 16px',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: t(`howDesc${point}`) }}
                                ></div>
                            </div>
                        );
                    })}
                </div>
            ),
        },
        {
            name: 'earlyFeatures',
            classBg: 'bg-dark',
            classFont: 'text-white',
            innerContent: generateContent('earlyFeatures', 'text-white', 'bg-dark', t),
        },
        {
            name: 'sampleMsg',
            classBg: 'bg-white',
            classFont: 'text-dark-font',
            innerContent: (
                <div className="max-w-3xl mx-auto space-y-12">
                    {[
                        { sender: t('mom'), initial: 'M', content: t('momMessage') },
                        { sender: t('dad'), initial: 'D', content: t('dadMessage') },
                        { sender: t('honey'), initial: 'H', content: t('honeyMessage') },
                    ].map(({ content, sender, initial }, i) => (
                        <SampleMessage key={i} content={content} sender={sender} initial={initial} i={i} />
                    ))}
                </div>
            ),
        },
        {
            name: 'beFirst',
            classBg: 'bg-gradient-hero',
            classFont: 'text-white',
            headerWithShadow: true,
            innerContent: (
                <button
                    className="bg-dark text-white text-md md:text-xl px-6 py-2 rounded-lg shadow hover:opacity-80"
                    onClick={() => setShowModal(true)}
                >
                    {t('beFirstBtn')}
                </button>
            ),
        },
        {
            name: 'creator',
            classBg: 'bg-dark',
            classFont: 'text-white',
            innerContent: (
                <a href="mailto:hello@flightagram.com">
                    <button className="bg-white text-dark-font text-md md:text-xl px-6 py-2 rounded-lg shadow hover:opacity-80">
                        {t('creatorBtn')}
                    </button>
                </a>
            ),
        },
        {
            name: 'privacyAndControl',
            classBg: 'bg-white',
            classFont: 'text-dark-font',
            innerContent: generateContentForPrivacy(t),
        },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Header setShowModal={setShowModal} scrollToSection={scrollToSection} />

            {sections.map((section) => {
                return (
                    <section className={`${section.classBg} py-20 px-6 text-center`} key={section.name} id={section.name}>
                        <h2
                            className={`${section.classFont} text-5xl font-semibold mb-8 font-space-grotesk ${section.headerWithShadow ? 'text-shadow-lg' : ''
                                }`}
                        >
                            {t(`${section.name}Title`)}
                        </h2>
                        {section.name !== 'earlyFeatures' && <h3 className={`${section.classFont} text-xl font-semibold mb-8`}>
                            {t(`${section.name}Subtitle`)}
                        </h3>}
                        {section.innerContent}
                    </section>
                );
            })}

            {showModal && <Modal setShowModal={setShowModal} />}
        </div>
    );
}
