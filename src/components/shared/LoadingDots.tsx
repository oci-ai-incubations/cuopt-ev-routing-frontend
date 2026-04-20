interface LoadingDotsProps {
  color?: string;
}

export function LoadingDots({ color = '#C74634' }: LoadingDotsProps) {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color }} />
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0.1s' }} />
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0.2s' }} />
    </div>
  );
}
