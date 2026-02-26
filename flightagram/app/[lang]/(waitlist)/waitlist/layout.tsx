import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type Props = {
  children: React.ReactNode;
};

export default function WaitlistLayout({children}: Props) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
