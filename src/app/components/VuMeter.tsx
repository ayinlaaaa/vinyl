/** Decorative analog VU bars. Animation is disabled by the global reduced-motion rule. */
export default function VuMeter({
  bars = 12,
  className = "",
}: {
  bars?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-[3px] h-10 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => {
        const height = 28 + ((i * 37) % 72);
        return (
          <span
            key={i}
            className="w-[3px] bg-vu origin-bottom animate-vu"
            style={{
              height: `${height}%`,
              animationDelay: `${i * 70}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
