import { CheckCircle2, Info } from "lucide-react";

export default function DataQualityNotice({
  estimatedCount,
  verifiedCount,
  timezone,
}: {
  estimatedCount: number;
  verifiedCount: number;
  timezone?: string;
}) {
  if (estimatedCount === 0) {
    return (
      <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <CheckCircle2 className="w-3 h-3 text-vu" />
        {verifiedCount.toLocaleString()} timestamp{verifiedCount === 1 ? "" : "s"} verified
        {timezone && ` · ${timezone}`}
      </p>
    );
  }

  return (
    <div className="flex items-start gap-3 border border-vu/20 bg-vu/5 p-4 text-xs text-muted-foreground">
      <Info className="w-4 h-4 shrink-0 text-vu" />
      <p>
        <span className="font-bold text-foreground">{estimatedCount.toLocaleString()} timestamp{estimatedCount === 1 ? " is" : "s are"} estimated.</span>{" "}
        Apple Music provides a recent list but not play times. The remaining {verifiedCount.toLocaleString()} timestamp{verifiedCount === 1 ? " is" : "s are"} verified by the source.
        {timezone && <span className="block mt-1 font-mono text-[10px]">Calendar analytics use {timezone}.</span>}
      </p>
    </div>
  );
}
