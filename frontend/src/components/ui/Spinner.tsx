export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-primary/30 border-t-primary ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
