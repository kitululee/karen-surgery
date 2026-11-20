"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AppointmentRequestModal } from "./AppointmentRequestModal";

export interface AppointmentPreset {
  serviceSlug?: string;
  practitionerSlug?: string;
  practitionerName?: string;
}

interface AppointmentContextValue {
  openAppointmentModal: (preset?: AppointmentPreset) => void;
  closeAppointmentModal: () => void;
}

const AppointmentContext = createContext<AppointmentContextValue>({
  openAppointmentModal: () => {},
  closeAppointmentModal: () => {},
});

export function useAppointmentModal() {
  return useContext(AppointmentContext);
}

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<AppointmentPreset>({});

  const openAppointmentModal = useCallback((nextPreset: AppointmentPreset = {}) => {
    setPreset(nextPreset);
    setIsOpen(true);
  }, []);

  const closeAppointmentModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AppointmentContext.Provider value={{ openAppointmentModal, closeAppointmentModal }}>
      {children}
      <AppointmentRequestModal
        open={isOpen}
        preset={preset}
        onClose={closeAppointmentModal}
      />
    </AppointmentContext.Provider>
  );
}
