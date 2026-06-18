interface CrownIconProps {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function CrownIcon({
  size = 16,
  fill = "#FFD700",
  stroke = "#000",
  strokeWidth = 1.5,
}: CrownIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20L2 9L7 13L12 4L17 13L22 9L22 20Z" />
    </svg>
  );
}
