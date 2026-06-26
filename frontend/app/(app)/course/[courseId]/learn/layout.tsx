/**
 * Video player layout — removes the left sidebar for a full-screen Coursera-like experience.
 * The left nav is replaced by the in-page course sidebar on the right.
 */
export default function VideoLearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-white z-30 overflow-hidden">
      {children}
    </div>
  );
}
