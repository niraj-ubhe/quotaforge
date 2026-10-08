import dns from "node:dns/promises";
import net, { LookupFunction } from "node:net";
import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";
import ipaddr from "ipaddr.js";

type Resolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

const resolveAll: Resolver = (hostname) =>
  dns.lookup(hostname, { all: true, verbatim: true });

const blockedHostnames = new Set([
  "metadata.google.internal",
  "metadata.google",
  "instance-data.ec2.internal",
]);

export const isPublicAddress = (address: string) => {
  if (!net.isIP(address)) return false;
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
};

const safeHostName = (hostname: string) =>
  !blockedHostnames.has(hostname.toLowerCase().replace(/\.$/, ""));

export const isSafeRedirectTarget = (protocol: string, hostname: string, auth?: string) => {
  const host = hostname.replace(/^\[|\]$/g, "");
  return (
    (protocol === "http:" || protocol === "https:") &&
    !auth &&
    safeHostName(host) &&
    (!net.isIP(host) || isPublicAddress(host))
  );
};

export const isSafePublicHttpUrl = async (
  value: string,
  resolver: Resolver = resolveAll,
) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    !safeHostName(url.hostname)
  ) return false;

  if (net.isIP(url.hostname)) return isPublicAddress(url.hostname);
  try {
    const addresses = await resolver(url.hostname);
    return addresses.length > 0 && addresses.every(({ address }) => isPublicAddress(address));
  } catch {
    return false;
  }
};

const safeLookup: LookupFunction = (hostname, options, callback) => {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (!safeHostName(host)) {
    const error = Object.assign(new Error("Upstream destination is not allowed"), { code: "EACCES" });
    return callback(error, "", 0);
  }
  const resolved = net.isIP(host)
    ? Promise.resolve([{ address: host, family: net.isIP(host) }])
    : resolveAll(host);

  resolved.then((addresses) => {
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      const error = Object.assign(new Error("Upstream destination is not allowed"), { code: "EACCES" });
      callback(error, "", 0);
      return;
    }
    const eligible = addresses.filter(({ family }) => !options.family || family === options.family);
    if (!eligible.length) {
      const error = Object.assign(new Error("No public address available"), { code: "ENOTFOUND" });
      callback(error, "", 0);
      return;
    }
    if (options.all) callback(null, eligible);
    else callback(null, eligible[0].address, eligible[0].family);
  }).catch((cause: NodeJS.ErrnoException) => {
    const error = Object.assign(new Error("Unable to resolve upstream destination"), { code: cause.code ?? "ENOTFOUND" });
    callback(error, "", 0);
  });
};

export const guardedHttpAgent = new HttpAgent({ lookup: safeLookup });
export const guardedHttpsAgent = new HttpsAgent({ lookup: safeLookup });
