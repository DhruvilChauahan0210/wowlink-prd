import { InvitationClosed } from "../../../ui/invitation-closed";

/** A personal link that no longer works: the host replaced or removed it, or the invitation isn't open. */
export default function PersonalLinkNotFound() {
  return <InvitationClosed/>;
}
