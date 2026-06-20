"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

import { ThemeProvider } from "~/providers/theme";
import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
    },
  },
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          {children}
        </trpc.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
