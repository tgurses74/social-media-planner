export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/logo.svg"
            alt="SM Planner"
            style={{ width: "40px", height: "40px", borderRadius: "9px", marginBottom: "4px" }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <p className="text-base font-bold tracking-tight">SM Planner</p>
            <p className="text-xs font-medium text-muted-foreground">by Openborders</p>
          </div>
          <p className="text-sm text-muted-foreground">Plan. Generate. Publish.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
