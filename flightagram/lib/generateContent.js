import { Shield, Eye, Lock, Database } from 'lucide-react';

export const generateContent = (name, classFont, classBg, t) => {
	return (
		<div className={`${classFont} grid md:grid-cols-3 gap-8 max-w-5xl mx-auto`}>
			{[1, 2, 3].map((point) => {
				return (
					<div
						key={point}
						className={`${classFont} ${classBg}/10 p-6 rounded-xl text-base/8 transition-all duration-300 hover:scale-105`}
						style={{
							background: 'linear-gradient(135deg, rgba(198, 164, 255, 0.2) 0%, rgba(255, 142, 199, 0.2) 100%)',
							boxShadow: 'rgba(198, 164, 255, 0.15) 0px 4px 16px',
						}}
						dangerouslySetInnerHTML={{ __html: t(`${name}${point}`) }}
					></div>
				);
			})}
		</div>
	);
};

export const generateContentForPrivacy = (t) => {
	return (
		<div className={`text-dark-font grid md:grid-cols-2 gap-8 max-w-5xl mx-auto font-space-grotesk`}>
			{[
				{ point: 1, icon: Eye },
				{ point: 2, icon: Shield },
				{ point: 3, icon: Lock },
				{ point: 4, icon: Database },
			].map(({ point, icon: Icon }) => {
				return (
					<div
						key={point}
						className={`text-dark-font bg-white/10 p-6 rounded-xl text-base/8 transition-all duration-300 hover:scale-105`}
						style={{
							background: 'linear-gradient(135deg, rgba(198, 164, 255, 0.2) 0%, rgba(255, 142, 199, 0.2) 100%)',
							boxShadow: 'rgba(198, 164, 255, 0.15) 0px 4px 16px',
						}}
					>
						<Icon className="h-10 w-10 mx-auto mb-4" style={{ color: '#C6A4FF' }} />
						<div dangerouslySetInnerHTML={{ __html: t(`privacyAndControl${point}`) }}></div>
					</div>
				);
			})}
		</div>
	);
};
