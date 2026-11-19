import {
  Activity,
  Brain,
  FlaskConical,
  HeartHandshake,
  ScanLine,
  Stethoscope,
} from "lucide-react";
import type { ServiceOverviewItem } from "@/data/services";

export function ServiceIcon({
  name,
  className = "h-5 w-5",
}: {
  name: ServiceOverviewItem["icon"];
  className?: string;
}) {
  switch (name) {
    case "stethoscope":
      return <Stethoscope className={className} aria-hidden="true" />;
    case "scan":
      return <ScanLine className={className} aria-hidden="true" />;
    case "brain":
      return <Brain className={className} aria-hidden="true" />;
    case "activity":
      return <Activity className={className} aria-hidden="true" />;
    case "heart-handshake":
      return <HeartHandshake className={className} aria-hidden="true" />;
    case "flask":
      return <FlaskConical className={className} aria-hidden="true" />;
  }
}
