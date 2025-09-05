// Health API functions
const API_URL = "/api/health";

export async function fetchHealthStatus(): Promise<Response> {
  return await fetch(API_URL);
}