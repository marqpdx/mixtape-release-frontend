import Footer from "@components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "1 0 auto" }}>{children}</div>
      <Footer />
    </div>
  );
}
