
import Footer from '@/components/Footer';

type Props = {
  children: React.ReactNode;
};

export default function SiteLayout({children}: Props) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
