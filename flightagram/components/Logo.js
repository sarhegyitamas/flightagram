import Link from 'next/link';

export const Logo = ({ size = 'md', showText = true, white = false }) => {
	const sizeClasses = {
		sm: 'h-8 md:h-8',
		md: 'h-10 md:h-12',
		lg: 'h-24 md:h-36',
    xl: 'h-52 md:h-80'
	};
	let filename = `/assets/flightagram_logo.png`;
	if (white) {
		filename = `/assets/flightagram_white_logo.png`;
	}

	return (
		<Link href={process.env.NEXT_PUBLIC_URL} className="flex items-center gap-2 md:gap-3 group transition-all hover:opacity-90">
			<img src={filename} alt="Flightagram" className={`${sizeClasses[size]}`} />
			{showText && <span className="text-lg md:text-xl font-bold transition-colors">Flightagram</span>}
		</Link>
	);
};
