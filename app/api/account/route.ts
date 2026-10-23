import { accountsOn, currentUser } from "../../lib/auth";

/** Whether hosts sign in on this site, and who is signed in (null when no one is). */
export async function GET(request: Request) {
  const user = await currentUser(request);
  return Response.json({ accounts: accountsOn(), user: user && { email: user.email } }, { headers: { "Cache-Control": "no-store" } });
}
