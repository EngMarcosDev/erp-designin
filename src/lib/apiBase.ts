const isPrivateHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host.startsWith("192.168.") ||
  host.startsWith("10.") ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

const getWindowProtocol = () => (window.location.protocol === "https:" ? "https:" : "http:");

export const resolveDefaultErpApiBase = () => {
  if (typeof window === "undefined") return "http://localhost:5050/api/erp";

  const host = window.location.hostname;
  const protocol = getWindowProtocol();

  if (host.endsWith("abacaxita.com.br")) {
    return `${protocol}//${window.location.host}/api/erp`;
  }

  if (isPrivateHost(host)) {
    return `${protocol}//${host}:5050/api/erp`;
  }

  return "/api/erp";
};

export const resolveErpApiBase = (configuredBase?: string) => {
  const normalized = (configuredBase || "").trim();
  if (!normalized) return resolveDefaultErpApiBase();

  if (typeof window === "undefined") return normalized;
  if (!/^https?:\/\//i.test(normalized)) return normalized;

  try {
    const parsed = new URL(normalized);
    const browserHost = window.location.hostname;
    const browserProtocol = getWindowProtocol();
    const fromLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (fromLocalhost && browserHost.endsWith("abacaxita.com.br")) {
      return `${browserProtocol}//${window.location.host}/api/erp`;
    }

    if (fromLocalhost && isPrivateHost(browserHost)) {
      parsed.hostname = browserHost;
      parsed.protocol = browserProtocol;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return normalized;
  }

  return normalized.replace(/\/$/, "");
};

export const resolveDefaultControlBase = () => {
  if (typeof window === "undefined") return "http://localhost:5050";

  const host = window.location.hostname;
  const protocol = getWindowProtocol();

  if (host.endsWith("abacaxita.com.br")) {
    return `${protocol}//${window.location.host}`;
  }

  if (isPrivateHost(host)) {
    return `${protocol}//${host}:5050`;
  }

  return "";
};
