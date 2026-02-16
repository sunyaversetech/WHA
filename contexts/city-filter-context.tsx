"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CityFilterContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  availableCities: string[];
  isLoading: boolean;
}

const CityFilterContext = createContext<CityFilterContextType | undefined>(
  undefined,
);

// Available cities - you can expand this list
const AVAILABLE_CITIES = [
  "All Cities",
  "Sydney",
  "Canberra",
  "Melbourne",
  "Brisbane",
];

// Available cities - you can expand this list
// const AVAILABLE_CITIES = [
//   'All Cities',
//   'Sydney',
//   'Melbourne',
//   'Brisbane',
//   'Perth',
//   'Adelaide',
//   'Canberra',
//   'Darwin',
//   'Hobart',
//   'Gold Coast',
//   'Newcastle',
//   'Wollongong',
//   'Geelong',
//   'Townsville',
//   'Cairns',
//   'Toowoomba',
//   'Ballarat',
//   'Bendigo',
//   'Albury-Wodonga',
//   'Launceston',
// ];

export function CityFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedCity, setSelectedCityState] = useState<string>("All Cities");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity && AVAILABLE_CITIES.includes(savedCity)) {
      setTimeout(() => {
        setSelectedCityState(savedCity);
      }, 0);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 0);
  }, []);

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem("selectedCity", city);
  };

  const value = {
    selectedCity,
    setSelectedCity,
    availableCities: AVAILABLE_CITIES,
    isLoading,
  };

  return (
    <CityFilterContext.Provider value={value}>
      {children}
    </CityFilterContext.Provider>
  );
}

export function useCityFilter() {
  const context = useContext(CityFilterContext);
  if (context === undefined) {
    throw new Error("useCityFilter must be used within a CityFilterProvider");
  }
  return context;
}
