import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type Props = {
  children: React.ReactNode;
};

export default function SiteLayout({children}: Props) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
