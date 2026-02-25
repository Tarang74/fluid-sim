import type { HTTPErrorResponse } from "@tarang-and-tina/shared/dist/api";

export async function request<TResponseBody>(
  method: string,
  url: string,
  params?: Record<string, string>,
  body?: BodyInit | null,
  query?: Record<string, string | number | undefined>,
): Promise<TResponseBody> {
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url = url.replace(`:${k}`, encodeURIComponent(v));
    }
  }

  if (query && Object.keys(query).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    );
    url += (url.includes("?") ? "&" : "?") + qs.toString();
  }

  const options: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = body;
  } else {
    options.body = undefined;
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    if (res.status === 500) {
      // There won't be an error attribute if the server cannot be reached
      console.error(
        `${method} ${url}: Server can not be reached (${res.status.toString()})`,
      );
      throw new Error("Server cannot be reached");
    } else {
      let json;

      try {
        json = (await res.json()) as unknown;
      } catch (err2: unknown) {
        console.error(
          `${method} ${url}: Error reason could not be obtained: ${String(
            err2,
          )} (${res.status.toString()})`,
        );
      }

      const err = (json as HTTPErrorResponse).error;
      console.error(`${method} ${url}: ${err} (${res.status.toString()})`);
      throw new Error(err);
    }
  }

  return res.json() as Promise<TResponseBody>;
}
