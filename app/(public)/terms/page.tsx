import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions — CFS" };

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "1. Who we are",
    body: [
      "Colet Fan Society (CFS) is a non-commercial fan community operating the coletfs.com website. We coordinate fan projects, charity drives, event productions, and merch drops that celebrate Colet.",
      "We are not affiliated with Colet, BINI, ABS-CBN, or any of their management or agencies.",
    ],
  },
  {
    heading: "2. Membership",
    body: [
      "Membership is free. By creating an account you confirm you are at least 13 years old and will keep your login credentials confidential.",
      "You are responsible for the content you post. We may hide or remove posts that violate our community guidelines, and we may suspend or ban accounts for repeated or serious violations.",
    ],
  },
  {
    heading: "3. Donations",
    body: [
      "Donations are voluntary contributions to CFS. They fund fan projects, charity drives, event productions, and platform costs, as documented in our public transparency reports.",
      "Donations are non-refundable except where required by Philippine law. Processing fees charged by PayMongo are shown at checkout and go to the payment gateway, not to CFS.",
      "If you designate a donation to a specific drive, CFS will make reasonable efforts to use it for that drive. Where a drive is over-funded or cancelled, remaining funds may be redirected to a similar drive at CFS's discretion.",
    ],
  },
  {
    heading: "4. Event tickets",
    body: [
      "Tickets are personal and non-transferable unless explicitly stated. Presenting a ticket that was not issued to you may result in denied entry.",
      "Ticket prices are non-refundable except where required by Philippine law or where CFS cancels the event. If CFS cancels, ticket holders will be refunded the ticket price via the original payment channel (processing fees are non-refundable).",
      "By registering, you agree to comply with venue rules, event guidelines, and any health and safety measures announced by CFS or the venue.",
    ],
  },
  {
    heading: "5. Shop orders",
    body: [
      "Orders are shipped to the address you provide at checkout. Please double-check your details — CFS is not liable for orders shipped to incorrect addresses provided by the buyer.",
      "Orders are non-refundable once shipped. If an item arrives damaged or defective, contact support within 7 days of delivery with photos and we will work with you on a replacement or refund.",
      "Shipping fees and processing fees are non-refundable.",
    ],
  },
  {
    heading: "6. Content and conduct",
    body: [
      "Do not post harassing, hateful, defamatory, sexually explicit, or copyright-infringing content.",
      "Do not impersonate other members, staff, artists, or brands.",
      "Do not use the site to scam, phish, spam, or advertise unrelated products or services.",
    ],
  },
  {
    heading: "7. Privacy",
    body: [
      "We collect only the information needed to run your account, process payments, and ship orders. We do not sell your personal information.",
      "Payment information is handled by PayMongo — CFS does not store card numbers or e-wallet credentials.",
    ],
  },
  {
    heading: "8. Changes to these terms",
    body: [
      "We may update these terms from time to time. Continued use of the site after an update means you accept the updated terms. Significant changes will be announced on the site.",
    ],
  },
  {
    heading: "9. Contact",
    body: [
      "For questions about these terms, membership, donations, or orders, reach us through the Support page or email binicoletfanprojects@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper, padding: "64px 24px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "3px", marginBottom: "12px" }}>LEGAL</div>
        <h1 style={{ fontFamily: S, fontSize: "clamp(2rem,4vw,3rem)", color: C.forest, lineHeight: 1.1, marginBottom: "8px" }}>Terms &amp; Conditions</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, marginBottom: "40px" }}>Last updated 2026-08-31</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {SECTIONS.map(({ heading, body }) => (
            <section key={heading}>
              <h2 style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "10px" }}>{heading.toUpperCase()}</h2>
              {body.map((p, i) => (
                <p key={i} style={{ fontFamily: B, fontSize: "14px", color: C.forest, lineHeight: 1.9, margin: "0 0 10px" }}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
