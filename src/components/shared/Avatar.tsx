interface AvatarProps {
  name: string;
  size?: number;
}

/** Renders a coloured circle with the user's initials. No external image deps. */
export function Avatar({ name, size = 28 }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Deterministic hue from the name string so each user gets a consistent colour.
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <span
      className="avatar"
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue}, 55%, 45%)`,
      }}
    >
      {initials}
    </span>
  );
}
