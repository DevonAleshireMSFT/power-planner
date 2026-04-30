interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({ label, color = '#fff', backgroundColor = '#0078d4' }: BadgeProps) {
  return (
    <span
      className="badge"
      style={{ color, backgroundColor }}
    >
      {label}
    </span>
  );
}
