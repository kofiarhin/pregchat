import { BASE_URL } from "../constants/baseUrl.js";
import { store } from "../store/store.js";
import { selectAuthToken } from "../store/ui/uiSlice.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const parseResponse = async (response, responseType) => {
  switch (responseType) {
    case "blob":
      return response.blob();
    case "arrayBuffer":
      return response.arrayBuffer();
    case "text":
      return response.text();
    case "json":
    default:
      return parseJsonSafe(response);
  }
};

const shouldRetry = (status) => status >= 500 && status < 600;

const buildHeaders = (headers = {}) => {
  const baseHeaders = { Accept: "application/json", ...headers };
  const token = selectAuthToken(store.getState());

  if (token && !baseHeaders.Authorization) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
};

const prepareBody = (options, headers) => {
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    return JSON.stringify(options.json);
  }

  if (options.body instanceof FormData) {
    const updatedHeaders = { ...headers };
    delete updatedHeaders["Content-Type"];
    return { body: options.body, headers: updatedHeaders };
  }

  if (options.body !== undefined) {
    return options.body;
  }

  return undefined;
};

export const httpRequest = async (path, options = {}) => {
  const retries = options.retries ?? 2;
  const retryDelay = options.retryDelay ?? 300;
  const responseType = options.responseType ?? "json";
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const headers = buildHeaders(options.headers);
      const bodyResult = prepareBody(options, headers);
      const body = bodyResult?.body ?? bodyResult;
      const finalHeaders = bodyResult?.headers ?? headers;

      const response = await fetch(`${BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: finalHeaders,
        body,
        signal: options.signal,
        credentials: options.credentials ?? "include",
        cache: options.cache,
      });

      if (response.ok) {
        return parseResponse(response, responseType);
      }

      const payload = await parseJsonSafe(response);
      const error = new Error(payload?.error || response.statusText || "Request failed");
      error.status = response.status;
      error.payload = payload;

      if (shouldRetry(response.status) && attempt < retries) {
        attempt += 1;
        lastError = error;
        await sleep(retryDelay * attempt);
        continue;
      }

      throw error;
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      if (attempt >= retries || !shouldRetry(error.status ?? 0)) {
        throw error;
      }

      attempt += 1;
      lastError = error;
      await sleep(retryDelay * attempt);
    }
  }

  throw lastError ?? new Error("Request failed");
};

export const http = {
  get: (path, options) => httpRequest(path, { ...options, method: "GET" }),
  post: (path, options) => httpRequest(path, { ...options, method: "POST" }),
  put: (path, options) => httpRequest(path, { ...options, method: "PUT" }),
  patch: (path, options) => httpRequest(path, { ...options, method: "PATCH" }),
  delete: (path, options) => httpRequest(path, { ...options, method: "DELETE" }),
};
