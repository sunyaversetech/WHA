// Client-only counterpart to lib/action.ts. That file's Get/Post/PATCH/
// Delete call getHeaders() — a "use server" function — which means every
// client-side call to it is a Next.js Server Action: a POST to the current
// page, serialized one-at-a-time by the framework, so N queries on a page
// queue up behind each other instead of running in parallel.
//
// getHeaders() builds an `Authorization: Bearer <user_token cookie>`
// header, but nothing in this codebase ever sets a "user_token" cookie —
// route handlers authenticate via next-auth's own session cookie
// (getServerSession), which the browser already sends automatically on
// same-origin requests. So that header is always absent in practice, and
// this file is a drop-in replacement with no behavior change: same
// exported names/shapes as lib/action.ts, just without the server-action
// round trip.
//
// Use this from client components/services. Keep lib/action.ts +
// getHeaders() for server components and route handlers only.

interface ApiProps extends RequestInit {
  url: string;
  params?: string;
}
interface MutatorProps<T> extends ApiProps {
  data: T;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function Get({ url, params }: ApiProps) {
  try {
    const endpointURL = params ? `${url}?${params}` : `${url}`;
    const res = await fetch(endpointURL, {
      method: "GET",
      headers: JSON_HEADERS,
      credentials: "same-origin",
    });
    return await res.json();
  } catch (error) {
    if (error instanceof Error)
      throw new Error(error.message, { cause: error.cause });
    throw new Error("An error occurred.");
  }
}

export async function Post<PayloadType, ResponseType>({
  url,
  data,
}: MutatorProps<PayloadType>): Promise<ResponseType> {
  try {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: "POST",
      headers: isFormData ? undefined : JSON_HEADERS,
      body: isFormData ? data : JSON.stringify(data),
      credentials: "same-origin",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Request failed");
    }

    return (await res.json()) as ResponseType;
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(error.message, { cause: error.cause });
    }
    throw new Error("An error occurred.");
  }
}

export async function PATCH<PayloadType, ResponseType>({
  url,
  data,
}: MutatorProps<PayloadType>): Promise<ResponseType> {
  try {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: "PATCH",
      headers: isFormData ? undefined : JSON_HEADERS,
      body: isFormData ? data : JSON.stringify(data),
      credentials: "same-origin",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Request failed");
    }

    return (await res.json()) as ResponseType;
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(error.message, { cause: error.cause });
    }
    throw new Error("An error occurred.");
  }
}

export async function Delete<ResponseType>({
  url,
}: {
  data?: any;
  url?: string;
}): Promise<ResponseType> {
  try {
    const res = await fetch(`${url}`, {
      method: "DELETE",
      headers: JSON_HEADERS,
      credentials: "same-origin",
    });
    return (await res.json()) as ResponseType;
  } catch (error: any) {
    throw {
      status: error.status || 500,
      message: error.message || "An error occurred",
    };
  }
}
