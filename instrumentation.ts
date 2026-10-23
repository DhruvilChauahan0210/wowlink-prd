import type { Instrumentation } from "next";

/*
 * Every uncaught server error in a page or route is noted (app/lib/errors.ts) for the admin page and the live-site
 * check. Only the method, the path without its query, and the message: no bodies, no query strings (sign-in codes).
 * The import sits inside the Node.js check so the edge bundle (the middleware) never includes the database client.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const failure = error as { message?: unknown; digest?: unknown };
    const { recordError } = await import("./app/lib/errors");
    await recordError({
      method: request.method,
      path: request.path.split("?")[0].slice(0, 200),
      message: String(failure?.message ?? error).slice(0, 500),
      digest: typeof failure?.digest === "string" ? failure.digest : null,
    }).catch(() => undefined);
  }
};
