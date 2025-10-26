"use client";
/* eslint-disable react-refresh/only-export-components */

import useInitNexus from "@/hooks/useInitializeNexus";
import {
  NexusSDK,
  type OnAllowanceHookData,
  type OnIntentHookData,
} from "@avail-project/nexus-core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAccount } from "wagmi";
import { nexusManager } from "@/lib/nexus/NexusManager";

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  intentRefCallback: React.RefObject<OnIntentHookData | null>;
  allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>;
  handleInit: () => Promise<void>;
}

const NexusContext = createContext<NexusContextType | null>(null);

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const sdk = useMemo(
    () =>
      new NexusSDK({
        network: "testnet",
        debug: true,
      }),
    [],
  );
  const { status } = useAccount();
  const {
    nexusSDK,
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  } = useInitNexus(sdk);

  const handleInit = useCallback(async () => {
    if (sdk.isInitialized()) {
      console.log("Nexus already initialized");
      return;
    }
    await initializeNexus();
    attachEventHooks();
    
    // Set the SDK instance in NexusManager
    if (nexusSDK) {
      nexusManager.setSDK(nexusSDK);
    }
  }, [sdk, attachEventHooks, initializeNexus, nexusSDK]);

  useEffect(() => {
    if (status === "connected") {
      handleInit();
    }
    if (status === "disconnected") {
      deinitializeNexus();
      // Clear the SDK instance from NexusManager
      nexusManager.setSDK(null);
    }
  }, [status, deinitializeNexus, handleInit]);

  const value = useMemo(
    () => ({
      nexusSDK,
      intentRefCallback,
      allowanceRefCallback,
      handleInit,
    }),
    [nexusSDK, intentRefCallback, allowanceRefCallback, handleInit],
  );

  return (
    <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
}

export default NexusProvider;