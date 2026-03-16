"use client";
import { useSuperAdminGetALLDeal } from "@/services/super-admin.service";
import React from "react";
import DealsTable from "./DealsTable";

const SuperAdminDeals = () => {
  const { data } = useSuperAdminGetALLDeal();
  console.log(data);
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deals Management</h1>
        <p className="text-gray-500 text-sm">
          Delete unneccesary Deals from the platform.
        </p>
      </div>

      {data ? (
        <DealsTable data={data.data} />
      ) : (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDeals;
