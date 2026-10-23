import { isAdminEmail } from "../../lib/admin";
import { accountsOn, currentUser } from "../../lib/auth";

/** Whether hosts sign in on this site, and who is signed in (null when no one is), and whether they're an admin. */
export async function GET(request: Request) {
  const user = await currentUser(request);
  return Response.json({ accounts: accountsOn(), user: user && { email: user.email, admin: isAdminEmail(user.email) } }, { headers: { "Cache-Control": "no-store" } });
}
