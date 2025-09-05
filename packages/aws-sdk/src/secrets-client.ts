import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { SecretsManagerClientConfig } from '@aws-sdk/client-secrets-manager';

/**
 * Secrets Manager client wrapper for configuration management
 */
export class SecretsClientWrapper {
  private client: SecretsManagerClient;

  constructor(config?: SecretsManagerClientConfig) {
    this.client = new SecretsManagerClient(config || {});
  }

  /**
   * Get a secret value by name
   */
  async getSecret(secretName: string): Promise<string> {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await this.client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret not found or empty: ${secretName}`);
    }

    return response.SecretString;
  }

  /**
   * Get a secret value and parse as JSON
   */
  async getSecretJson<T = any>(secretName: string): Promise<T> {
    const secretString = await this.getSecret(secretName);
    
    try {
      return JSON.parse(secretString) as T;
    } catch (error) {
      throw new Error(`Failed to parse secret as JSON: ${secretName}`);
    }
  }

  /**
   * Get multiple secrets in parallel
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const promises = secretNames.map(async (name) => {
      const value = await this.getSecret(name);
      return [name, value] as const;
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  }
}