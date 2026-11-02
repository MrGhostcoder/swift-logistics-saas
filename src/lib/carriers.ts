import dhl from "@/assets/carriers/dhl.svg";
import fedex from "@/assets/carriers/fedex.svg";
import ups from "@/assets/carriers/ups.svg";
import usps from "@/assets/carriers/usps.svg";
import dpd from "@/assets/carriers/dpd.svg";
import tnt from "@/assets/carriers/tnt.svg";

export type CarrierId = "swifttrack" | "dhl" | "fedex" | "ups" | "usps" | "dpd" | "tnt" | "other";

export type Carrier = {
  id: CarrierId;
  name: string;
  tagline: string;
  /** Monochrome SVG logo, tinted with the carrier's brand color. */
  logo?: string;
};

export const CARRIERS: Carrier[] = [
  { id: "swifttrack", name: "SwiftTrack", tagline: "Our own network" },
  { id: "dhl", name: "DHL", tagline: "Express worldwide", logo: dhl },
  { id: "fedex", name: "FedEx", tagline: "Priority & ground", logo: fedex },
  { id: "ups", name: "UPS", tagline: "Ground & air", logo: ups },
  { id: "usps", name: "USPS", tagline: "US Postal Service", logo: usps },
  { id: "dpd", name: "DPD", tagline: "European parcels", logo: dpd },
  { id: "tnt", name: "TNT", tagline: "Freight & express", logo: tnt },
  { id: "other", name: "Other", tagline: "Local or private courier" },
];

export const DEFAULT_CARRIER: CarrierId = "swifttrack";

export function getCarrier(id?: string | null | undefined): Carrier {
  return CARRIERS.find((c) => c.id === id) ?? (CARRIERS[0] as Carrier);
}
