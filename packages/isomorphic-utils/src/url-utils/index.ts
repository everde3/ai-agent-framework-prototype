/**
 * Builds a domain URL based on environment stage
 * Following the established pattern from deployment/src/create-service-task.ts
 *
 * @param options - Configuration object for domain building
 * @param options.environmentStage - The environment stage (production, staging, sandbox, demo, preview, dev-*, etc.)
 * @param options.subdomain - Optional subdomain to prepend (e.g., "api", "internal-api")
 * @param options.useDevEnvNames - Whether to use dev environment names or treat dev-* as staging (defaults to true)
 * @returns The full domain URL
 */
export const buildDomainUrl = (
  options: {
    environmentStage?: string;
    subdomain?: string;
    useDevEnvNames?: boolean;
  } = {}
): string => {
  const { environmentStage, subdomain, useDevEnvNames = true } = options;
  let domain: string;

  if (!environmentStage || environmentStage === "other") {
    domain = "staging.talent.repo.com";
  } else if (environmentStage === "local" || environmentStage === "localhost") {
    return "localhost:8888";
  } else if (environmentStage.startsWith("dev-")) {
    if (useDevEnvNames) {
      const devEnvironment = environmentStage.replace("dev-", "");
      domain = `${devEnvironment}.staging.repo.com`;
    } else {
      domain = "staging.talent.repo.com";
    }
  } else if (environmentStage === "production") {
    domain = "talent.repo.com";
  } else if (
    ["staging", "sandbox", "demo", "preview"].includes(environmentStage)
  ) {
    domain = `${environmentStage}.talent.repo.com`;
  } else {
    // Default fallback for other environments
    domain = `${environmentStage}.staging.repo.com`;
  }

  if (subdomain) {
    return `${subdomain}.${domain}`;
  }

  return domain;
};

/**
 * Builds a full URL with protocol based on environment stage
 *
 * @param options - Configuration object for URL building
 * @param options.environmentStage - The environment stage
 * @param options.subdomain - Optional subdomain to prepend
 * @param options.path - Optional path to append (should start with /)
 * @param options.protocol - Protocol to use (defaults to https)
 * @returns The full URL
 */
export const buildUrl = (
  options: {
    environmentStage?: string;
    subdomain?: string;
    path?: string;
    protocol?: "http" | "https";
  } = {}
): string => {
  const { environmentStage, subdomain, path, protocol } = options;

  // Determine the protocol - use http for local environments unless explicitly overridden
  const finalProtocol =
    protocol ||
    (environmentStage === "local" || environmentStage === "localhost"
      ? "http"
      : "https");

  const domain = buildDomainUrl({ environmentStage, subdomain });
  const basePath = path || "";

  return `${finalProtocol}://${domain}${basePath}`;
};
