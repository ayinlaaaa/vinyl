import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export default function StatusMessage({
  type,
  children,
}: {
  type: "success" | "error";
  children: ReactNode;
}) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 p-4 text-sm font-medium ${
        type === "success" ? "bg-vu/10 text-vu" : "bg-destructive/15 text-destructive"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}
