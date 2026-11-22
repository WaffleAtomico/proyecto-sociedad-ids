import { NextRequest } from "next/server";
import { generateJWT } from "../../src/utils/jwt_generator";
import { UserType } from "../../src/types/enums";

export const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
export const USER_ID = "22222222-2222-4222-8222-222222222222";

export function tokenFor(
  role: UserType = UserType.REGULAR_USER,
  id: string = USER_ID
): string {
  return generateJWT({
    id,
    email: role === UserType.ADMINISTRATOR ? "admin@iteso.mx" : "user@iteso.mx",
    name: role === UserType.ADMINISTRATOR ? "Admin" : "User",
    role,
  });
}

export const adminToken = () => tokenFor(UserType.ADMINISTRATOR, ADMIN_ID);
export const userToken = () => tokenFor(UserType.REGULAR_USER, USER_ID);

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  rawBody?: string;
  searchParams?: Record<string, string>;
}

export function apiRequest(
  path: string,
  { method = "GET", body, token, rawBody, searchParams }: RequestOptions = {}
): NextRequest {
  const url = new URL(path, "http://localhost:3000");

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers = new Headers();
  if (body !== undefined || rawBody !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return new NextRequest(url, {
    method,
    headers,
    body:
      rawBody !== undefined
        ? rawBody
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
}

export function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(response: Response): Promise<any> {
  return response.json();
}
