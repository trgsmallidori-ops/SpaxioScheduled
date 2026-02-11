import { NextResponse } from "next/server";

const isDev = () => process.env.NODE_ENV === "development";

export type HttpStatus = 400 | 401 | 403 | 404 | 429 | 500 | 503;

/**
 * Consistent API error responses. Use in route handlers.
 */
export function apiError(
  message: string,
  status: HttpStatus = 500,
  options?: { details?: string; code?: string }
) {
  const body: Record<string, unknown> = {
    error: message,
    ...(options?.code && { code: options.code }),
    ...(isDev() && options?.details && { details: options.details }),
  };
  return NextResponse.json(body, { status });
}

/**
 * Log and return 500 for unexpected errors. Hides message in production.
 */
export function handleUnexpectedError(err: unknown, context: string) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[${context}]`, message, stack ?? "");
  return NextResponse.json(
    {
      error: isDev() ? message : "An unexpected error occurred",
      ...(isDev() && stack && { details: stack }),
    },
    { status: 500 }
  );
}
