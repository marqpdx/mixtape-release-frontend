export function StateNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mals-state-notice" role="status">
      <span aria-hidden="true">*</span>
      <p>{children}</p>
    </div>
  );
}
