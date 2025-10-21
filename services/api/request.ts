interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

export const request = async <T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = "GET", headers = {}, body } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to the server");
    }
    throw new Error("Unknown error occurred");
  }
};

export const get = <T>(
  url: string,
  headers?: Record<string, string>
): Promise<T> => {
  return request<T>(url, { method: "GET", headers });
};

export const post = <T>(
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> => {
  return request<T>(url, { method: "POST", body, headers });
};

export const put = <T>(
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> => {
  return request<T>(url, { method: "PUT", body, headers });
};

export const del = <T>(
  url: string,
  headers?: Record<string, string>
): Promise<T> => {
  return request<T>(url, { method: "DELETE", headers });
};
