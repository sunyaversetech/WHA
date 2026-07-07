"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/Dashboard/Resources/Form/ResourceForm";
import { useGetSingleResource } from "@/services/resource.service";

export default function EditResourcePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetSingleResource(id);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#051e3a] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <ResourceForm initialData={data?.data} />;
}
