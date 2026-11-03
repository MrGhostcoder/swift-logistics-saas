import { CARRIER_PATHS } from "@/lib/carrier-paths";

export type CarrierId = "swifttrack" | "dhl" | "fedex" | "ups" | "usps" | "dpd" | "tnt" | "other";

export type Carrier = {
  id: CarrierId;
  name: string;
  tagline: string;
  /** Single SVG path (24x24 viewBox), tinted with the carrier's brand color. */
  path?: string;
};

export const CARRIERS: Carrier[] = [
  { id: "swifttrack", name: "SwiftTrack", tagline: "Our own network" },
  { id: "dhl", name: "DHL", tagline: "Express worldwide", path: CARRIER_PATHS.dhl },
  { id: "fedex", name: "FedEx", tagline: "Priority & ground", path: CARRIER_PATHS.fedex },
  { id: "ups", name: "UPS", tagline: "Ground & air", path: CARRIER_PATHS.ups },
  { id: "usps", name: "USPS", tagline: "US Postal Service", path: CARRIER_PATHS.usps },
  { id: "dpd", name: "DPD", tagline: "European parcels", path: CARRIER_PATHS.dpd },
  { id: "tnt", name: "TNT", tagline: "Freight & express", path: CARRIER_PATHS.tnt },
  { id: "other", name: "Other", tagline: "Local or private courier" },
];

export const DEFAULT_CARRIER: CarrierId = "swifttrack";

export function getCarrier(id?: string | null | undefined): Carrier {
  return CARRIERS.find((c) => c.id === id) ?? (CARRIERS[0] as Carrier);
}
