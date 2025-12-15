import { gql } from "@urql/solid";
import { client } from "./urql";

export const GET_WIDGET_CONFIG = gql`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`;

export const SAVE_WIDGET_CONFIG = gql`
  mutation SaveWidgetConfig($input: SaveWidgetConfigInput!) {
    saveWidgetConfig(input: $input) {
      result {
        id
        config
      }
      errors {
        message
      }
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
    }
  }
`;

interface SaveWidgetConfigParams<T> {
  userId: string;
  type: string;
  config: T;
}

interface LoadWidgetConfigParams {
  userId: string;
  type: string;
}

export async function saveWidgetConfig<T>({ userId, type, config }: SaveWidgetConfigParams<T>) {
  const result = await client.mutation(
    SAVE_WIDGET_CONFIG,
    {
      input: {
        userId,
        type,
        config: JSON.stringify(config), // Convert to JSON string
      },
    },
    { fetchOptions: { credentials: "include" } }
  );

  return result;
}

export async function loadWidgetConfig<T>({ userId, type }: LoadWidgetConfigParams): Promise<T | null> {
  const result = await client.query(
    GET_WIDGET_CONFIG,
    { userId, type },
    { fetchOptions: { credentials: "include" } }
  );

  if (result.data?.widgetConfig?.config) {
    try {
      // Parse JSON string to object
      return JSON.parse(result.data.widgetConfig.config) as T;
    } catch (e) {
      console.error("Failed to parse widget config:", e);
      return null;
    }
  }

  return null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const result = await client.query(
    GET_CURRENT_USER,
    {},
    { fetchOptions: { credentials: "include" } }
  );

  return result.data?.currentUser?.id || null;
}