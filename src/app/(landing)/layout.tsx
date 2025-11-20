import Navbar from '@/components/providers/Navbar'
import Footer from '@/components/providers/Footer'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
