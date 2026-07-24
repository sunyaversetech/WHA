"use client";

import { useParams } from "next/navigation";
import ResourceSchedulePage from "@/components/Dashboard/Resources/ResourceSchedulePage";

export default function ResourceScheduleRoute() {
  const { id } = useParams<{ id: string }>();
  return <ResourceSchedulePage id={id} />;
}
