import { adminDenied } from "../../../../lib/admin";
import { adminInvitation, moderate, type Moderation } from "../../../../lib/store";

type Params = { params: Promise<{ slug: string }> };
const ACTIONS: Moderation[] = ["take-down", "restore", "dismiss", "make-pro", "make-free"];
const missing = () => Response.json({ error: "There’s no invitation at that link." }, { status: 404 });

/** One invitation, as the admin sees it (found by its link, for a report that came in some other way). Admin only. */
export async function GET(request: Request, { params }: Params) {
  const denied = adminDenied(request);
  if (denied) return denied;
  const invitation = await adminInvitation((await params).slug);
  return invitation ? Response.json({ invitation }, { headers: { "Cache-Control": "no-store" } }) : missing();
}

/** { action: "take-down" | "restore" | "dismiss" | "make-pro" | "make-free" }. Admin only. */
export async function POST(request: Request, { params }: Params) {
  const denied = adminDenied(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!ACTIONS.includes(body?.action)) return Response.json({ error: "Take it down, restore it, or dismiss its reports." }, { status: 400 });
  const result = await moderate((await params).slug, body.action);
  return result.ok ? Response.json({ invitation: result.invitation }) : missing();
}
