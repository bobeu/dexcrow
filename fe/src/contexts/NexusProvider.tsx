"use client";
/* eslint-disable react-refresh/only-export-components */

import useInitNexus from "@/hooks/useInitializeNexus";
import { NexusManager } from "@/lib/nexus";
import {
  NexusSDK,
  // type OnAllowanceHookData,
  // type OnIntentHookData,
} from "@avail-project/nexus-core";
import { createContext, useContext } from "react";

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  nexusManager: NexusManager | null;
  // intentRefCallback: React.RefObject<OnIntentHookData | null>;
  // allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>;
  // handleInit: () => Promise<void>;
}

const NexusContext = createContext<NexusContextType | null>(null);

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const { nexusSDK, nexusManager } = useInitNexus();
  return (
    <NexusContext.Provider 
      value={{
        nexusManager,
        nexusSDK
      }}>
      {children}
    </NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if(!context) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
}

export default NexusProvider;