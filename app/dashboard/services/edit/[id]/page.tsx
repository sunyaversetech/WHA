"use client";
import React from "react";
import ServiceForm from "../../add/page";
import { useParams } from "next/navigation";
import { useGetSingleService } from "@/services/services.service";

const ServiceEdit = () => {
  const params = useParams();
  const { id } = params;

  const { data, isLoading } = useGetSingleService(id as string);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }
  return <ServiceForm initialData={data?.data} />;
};

export default ServiceEdit;
