"use client";

import { CalendarClock } from "lucide-react";
import { useAppointmentModal, type AppointmentPreset } from "./AppointmentContext";

interface AppointmentTriggerButtonProps extends AppointmentPreset {
  label?: string;
  variant?: "primary" | "secondary" | "card";
  className?: string;
}

export function AppointmentTriggerButton({
  label = "Request Appointment",
  variant = "primary",
  serviceSlug,
  practitionerSlug,
  practitionerName,
  className = "",
}: AppointmentTriggerButtonProps) {
  const { openAppointmentModal } = useAppointmentModal();

  const handleClick = () => {
    openAppointmentModal({ serviceSlug, practitionerSlug, practitionerName });
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-forest-deep)] hover:border-[var(--color-forest-deep)] transition-colors cursor-pointer ${className}`}
      >
        <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-pill ${
        variant === "secondary" ? "btn-pill-secondary" : "btn-pill-primary"
      } ${className}`}
    >
      <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
