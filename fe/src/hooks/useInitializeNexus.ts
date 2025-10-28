"use client";
import { NexusManager } from "@/lib/nexus/NexusManager";
import { EthereumProvider, NexusSDK, OnAllowanceHookData, OnIntentHookData } from "@avail-project/nexus-core";
import { useRef, useState, useEffect } from "react";

import { useAccount } from "wagmi";

const useInitNexus = () => {
  const { connector, chainId, status } = useAccount();
  const [ nexusSDK, setNexusSDK ] = useState<NexusSDK | null>(null);
  const [ nexusManager, setNexusManager ] = useState<NexusManager | null>(null);
  const intentRefCallback = useRef<OnIntentHookData | null>(null);
  const allowanceRefCallback = useRef<OnAllowanceHookData | null>(null);

  useEffect(() => {
    setNexusSDK(new NexusSDK({network: 'testnet'}));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initializeNexus = async () => {
      try{
          if(nexusSDK && !nexusSDK.isInitialized()) {
            const provider = (await connector?.getProvider()) as EthereumProvider;
            if(provider && status === "connected") {
              await nexusSDK.initialize(provider);
              const nManager = new NexusManager(chainId);
              setNexusManager(nManager);
            } else {
              console.warn("Provider not ready");
            }
          }

          if(nexusSDK && nexusSDK.isInitialized() && status === "disconnected") {
            await nexusSDK.deinit();
            setNexusSDK(null);
            setNexusManager(null);
          }
        } catch (error) {
          console.error("Error initializing Nexus:", error);
      }
    };
    initializeNexus();
    return controller.abort();
  }, [connector, chainId, status]);

  // const deinitializeNexus = async () => {
  //   try {
  //     if(nexusSDK && nexusSDK.isInitialized()){
  //       await nexusSDK.deinit();
  //       setNexusSDK(null);
  //     } 
  //   } catch (error) {
  //     console.error("Error deinitializing Nexus:", error);
  //   }
  // };

  // const attachEventHooks = () => {
  //   sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
  //     // const { sources, allow, deny } = data;
  //     // This is a hook for the dev to show user the allowances that need to be setup for the current tx to happen
  //     // where,
  //     // sources: an array of objects with minAllowance, chainID, token symbol, etc.
  //     // allow(allowances): continues the transaction flow with the specified allowances; `allowances` is an array with the chosen allowance for each of the requirements (allowances.length === sources.length), either 'min', 'max', a bigint or a string
  //     // deny(): stops the flow
  //     allowanceRefCallback.current = data;
  //   });

  //   sdk.setOnIntentHook((data: OnIntentHookData) => {
  //     // const { intent, allow, deny, refresh } = data;
  //     // This is a hook for the dev to show user the intent, the sources and associated fees
  //     // where,
  //     // intent: Intent data containing sources and fees for display purpose
  //     // allow(): accept the current intent and continue the flow
  //     // deny(): deny the intent and stop the flow
  //     // refresh(): should be on a timer of 5s to refresh the intent (old intents might fail due to fee changes if not refreshed)
  //     intentRefCallback.current = data;
  //   });
  // };

  return {
    nexusSDK,
    nexusManager,
    // deinitializeNexus,
    // attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  };
};

export default useInitNexus;