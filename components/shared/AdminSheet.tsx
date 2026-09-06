"use client";
// Shared admin modal/sheet built on Vaul. On mobile it renders as a
// bottom sheet with a drag handle (tactile, easy to dismiss). On
// desktop (≥768px) it renders as a centered dialog. Styling matches
// the rest of the admin: cream background, forest text, subtle
// shadow, spring easing.
//
// Usage:
//   const [open, setOpen] = useState(false);
//   <AdminSheet
//     open={open}
//     onOpenChange={setOpen}
//     title="Delete Project?"
//     description="This can't be undone."
//     footer={
//       <>
//         <button className="btn-fx" onClick={() => setOpen(false)}>Cancel</button>
//         <button className="btn-fx btn-fx-primary" onClick={handleDelete}>Delete</button>
//       </>
//     }
//   >
//     …custom body…
//   </AdminSheet>

import { Drawer } from "vaul";
import { ReactNode } from "react";

const S  = "var(--font-dm-serif,'DM Serif Display',Georgia,serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Max width on desktop. Default 480px. */
  maxWidth?: number;
  /** Show the drag handle on mobile. Default true. */
  handle?: boolean;
}

export default function AdminSheet({
  open, onOpenChange, title, description, children, footer, maxWidth = 480, handle = true,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(15, 42, 30, 0.45)",
        }} />
        <Drawer.Content
          aria-describedby={description ? undefined : ""}
          className="admin-sheet"
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 51,
            background: "#FFFFFF",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            boxShadow: "0 -10px 40px rgba(15,42,30,0.15)",
            maxWidth: "100%",
            outline: "none",
          }}
        >
          {handle && (
            <div style={{
              display: "flex", justifyContent: "center", padding: "10px 0 4px",
            }}>
              <div style={{ width: 48, height: 4, background: "#DDE8DD", borderRadius: 999 }} />
            </div>
          )}

          <div style={{
            maxWidth,
            margin: "0 auto",
            padding: "12px 24px 24px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {title && (
              <Drawer.Title asChild>
                <h2 style={{ fontFamily: S, fontSize: 22, color: "#1B3A2D", margin: 0, lineHeight: 1.2 }}>{title}</h2>
              </Drawer.Title>
            )}
            {description && (
              <Drawer.Description asChild>
                <p style={{ fontFamily: B, fontSize: 13, color: "#5A7A60", margin: 0, lineHeight: 1.55 }}>{description}</p>
              </Drawer.Description>
            )}

            {children && <div style={{ fontFamily: B, fontSize: 14, color: "#1B3A2D" }}>{children}</div>}

            {footer && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", paddingTop: 4 }}>
                {footer}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>

      <style>{`
        /* Desktop: center the sheet instead of pinning to the bottom. */
        @media (min-width: 768px) {
          .admin-sheet {
            top: 50% !important;
            bottom: auto !important;
            left: 50% !important;
            right: auto !important;
            transform: translate(-50%, -50%);
            width: ${maxWidth}px;
            max-width: calc(100vw - 32px);
            border-radius: 20px !important;
          }
        }
      `}</style>
    </Drawer.Root>
  );
}
