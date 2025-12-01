// ============================================
// JPM COLLEGE APP - HASURA GRAPHQL CLIENT
// ============================================

import { GraphQLClient } from 'graphql-request';
import { supabase } from '../supabase';

// Hasura GraphQL endpoint
const HASURA_ENDPOINT = process.env.EXPO_PUBLIC_HASURA_ENDPOINT || 
  'https://college-app.hasura.app/v1/graphql';

const HASURA_ADMIN_SECRET = process.env.EXPO_PUBLIC_HASURA_ADMIN_SECRET || 'HVT25ZPcgXcv0z2U0O7DCnFUwnZKaAofseki4rvNRCDF02xEi9j2EgGwZj9QEFKb';

// Create base client
const createClient = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use JWT token from Supabase for authenticated requests
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // For admin operations (server-side only)
  if (HASURA_ADMIN_SECRET) {
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }

  return new GraphQLClient(HASURA_ENDPOINT, { headers });
};

// GraphQL client singleton with auth refresh
class HasuraClient {
  private client: GraphQLClient | null = null;

  async getClient(): Promise<GraphQLClient> {
    this.client = await createClient();
    return this.client;
  }

  async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const client = await this.getClient();
    return client.request<T>(query, variables);
  }
}

export const hasuraClient = new HasuraClient();

// Helper for queries
export async function gqlQuery<T>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> {
  return hasuraClient.request<T>(query, variables);
}

// Helper for mutations
export async function gqlMutation<T>(
  mutation: string, 
  variables?: Record<string, unknown>
): Promise<T> {
  return hasuraClient.request<T>(mutation, variables);
}
