export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-accent text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-muted mt-2 max-w-prose leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
