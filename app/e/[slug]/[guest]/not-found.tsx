import { MomentMark, WowLinkBrand } from "../../../ui/brand";

/** A personal link that no longer works: the host replaced or removed it, or unpublished the invitation. */
export default function PersonalLinkNotFound() {
  return <div className="cinema inv-not-found theme-paper"><header><WowLinkBrand/></header><main><MomentMark/><h1>This invitation link <em>has changed.</em></h1><p>Please ask the hosts to send you the new one.</p></main></div>;
}
