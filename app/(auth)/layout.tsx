export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Social Media Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan. Generate. Publish.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
