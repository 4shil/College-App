// ============================================
// JPM COLLEGE APP - HASURA GRAPHQL CLIENT
// Lazy-loaded - only connects when actually used
// ============================================

import { GraphQLClient } from 'graphql-request';

// Hasura GraphQL endpoint - will be configured when Hasura is set up
const HASURA_ENDPOINT = process.env.EXPO_PUBLIC_HASURA_ENDPOINT || 
  'https://college-app.hasura.app/v1/graphql';

const HASURA_ADMIN_SECRET = process.env.EXPO_PUBLIC_HASURA_ADMIN_SECRET || '';

// Flag to check if Hasura is configured
const isHasuraConfigured = () => {
  return !!process.env.EXPO_PUBLIC_HASURA_ENDPOINT;
};

// Create client only when needed (lazy initialization)
const createClient = async () => {
  // Only import supabase when actually creating a client
  const { supabase } = await import('../supabase');
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  if (HASURA_ADMIN_SECRET) {
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }

  return new GraphQLClient(HASURA_ENDPOINT, { 
    headers,
  });
};

// GraphQL client singleton with auth refresh (lazy-loaded)
class HasuraClient {
  private client: GraphQLClient | null = null;

  async getClient(): Promise<GraphQLClient> {
    if (!isHasuraConfigured()) {
      throw new Error('Hasura is not configured. Set EXPO_PUBLIC_HASURA_ENDPOINT in your environment.');
    }
    this.client = await createClient();
    return this.client;
  }

  async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const client = await this.getClient();
    return client.request<T>(query, variables);
  }
}

export const hasuraClient = new HasuraClient();

// Helper for queries - only use when Hasura is set up
export async function gqlQuery<T>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> {
  return hasuraClient.request<T>(query, variables);
}

// Helper for mutations - only use when Hasura is set up
export async function gqlMutation<T>(
  mutation: string, 
  variables?: Record<string, unknown>
): Promise<T> {
  return hasuraClient.request<T>(mutation, variables);
}
