"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface RedeemContextType {
  redeemedDeals: string[];
  redeemDeal: (dealId: string) => void;
  isDealRedeemed: (dealId: string) => boolean;
}

const RedeemContext = createContext<RedeemContextType | undefined>(undefined);

export function RedeemProvider({ children }: { children: ReactNode }) {
  const [redeemedDeals, setRedeemedDeals] = useState<string[]>([]);

  useEffect(() => {
    const savedRedeems = localStorage.getItem("redeemedDeals");
    if (savedRedeems) {
      try {
        setTimeout(() => {
          setRedeemedDeals(JSON.parse(savedRedeems));
        }, 0);
      } catch (error) {
        console.error(
          "Failed to parse redeemed deals from localStorage",
          error,
        );
        setTimeout(() => {
          setRedeemedDeals([]);
        }, 0);
        localStorage.setItem("redeemedDeals", JSON.stringify([]));
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("redeemedDeals", JSON.stringify(redeemedDeals));
  }, [redeemedDeals]);

  const redeemDeal = (dealId: string) => {
    if (!redeemedDeals.includes(dealId)) {
      setRedeemedDeals((prev) => [...prev, dealId]);
    }
  };

  const isDealRedeemed = (dealId: string) => {
    return redeemedDeals.includes(dealId);
  };

  return (
    <RedeemContext.Provider
      value={{ redeemedDeals, redeemDeal, isDealRedeemed }}>
      {children}
    </RedeemContext.Provider>
  );
}

export function useRedeem() {
  const context = useContext(RedeemContext);
  if (context === undefined) {
    throw new Error("useRedeem must be used within a RedeemProvider");
  }
  return context;
}
