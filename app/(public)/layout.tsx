import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AnnouncementBanner from "@/components/shared/AnnouncementBanner";
import ImpersonationBanner from "@/components/shared/ImpersonationBanner";
import { loadActiveAnnouncement } from "@/lib/site-announcement";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ann = await loadActiveAnnouncement();
  return (
    <div className="flex flex-col min-h-screen">
      <ImpersonationBanner />
      {ann && <AnnouncementBanner text={ann.text} color={ann.color} ctaLabel={ann.ctaLabel} ctaUrl={ann.ctaUrl} />}
      <Navbar />
      <main className="flex-1 page-enter">{children}</main>
      <Footer />
    </div>
  );
}
