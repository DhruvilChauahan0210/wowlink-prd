import { InvitationClosed } from "../../ui/invitation-closed";

/** An invitation's link that doesn't open (unpublished, ended, taken down, or never there): told to the guest plainly. */
export default function InvitationNotFound() {
  return <InvitationClosed/>;
}
