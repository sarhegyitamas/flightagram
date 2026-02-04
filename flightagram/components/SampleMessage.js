import React from 'react';

export default function SampleMessage({ content, sender, initial, i }) {
	return (
		<div className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
			<div className="max-w-md">
				<div
					className={`p-6 rounded-3xl transition-all duration-300 hover:scale-102 ${
						i % 2 === 0 ? 'rounded-tl-sm' : 'rounded-tr-sm'
					}`}
					style={{
						background:
							i % 2 === 0
								? 'linear-gradient(135deg, rgba(198, 164, 255, 0.15) 0%, rgba(255, 142, 199, 0.10) 100%)'
								: 'linear-gradient(135deg, rgba(255, 191, 169, 0.15) 0%, rgba(255, 142, 199, 0.10) 100%)',
						boxShadow: '0 4px 20px rgba(198, 164, 255, 0.15)',
						border: '1px solid rgba(198, 164, 255, 0.2)',
					}}
				>
					<div className="flex items-center gap-3 mb-3">
						<div
							className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
							style={{
								background:
									i % 2 === 0
										? 'linear-gradient(135deg, #C6A4FF 0%, #FF8EC7 100%)'
										: 'linear-gradient(135deg, #FF8EC7 0%, #FFBFA9 100%)',
								boxShadow: '0 2px 12px rgba(198, 164, 255, 0.3)',
							}}
						>
							{initial}
						</div>
						<span className="text-sm font-bold" style={{ color: '#3A2D53' }}>
							{sender}
						</span>
					</div>
					<p className="text-left text-base/8" style={{ color: '#3A2D53' }}>
						{content}
					</p>
				</div>
			</div>
		</div>
	);
}
