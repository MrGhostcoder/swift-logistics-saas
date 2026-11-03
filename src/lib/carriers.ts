import { CARRIER_PATHS } from "@/lib/carrier-paths";

export type CarrierId =
  | "swifttrack"
  | "dhl"
  | "fedex"
  | "ups"
  | "usps"
  | "dpd"
  | "tnt"
  | "amazon"
  | "deutschepost"
  | "hermes"
  | "toll"
  | "royalmail"
  | "canadapost"
  | "auspost"
  | "gls"
  | "aramex"
  | "sfexpress"
  | "postnl"
  | "purolator"
  | "evri"
  | "inpost"
  | "japanpost"
  | "other";

export type Carrier = {
  id: CarrierId;
  name: string;
  tagline: string;
  /** Single SVG path (24x24 viewBox), tinted with the carrier's brand color. */
  path?: string;
  /** Short lettermark in brand colors, for carriers without a freely licensed logo. */
  mark?: string;
};

export const CARRIERS: Carrier[] = [
  { id: "swifttrack", name: "SwiftTrack", tagline: "Our own network" },
  { id: "dhl", name: "DHL", tagline: "Express worldwide", path: CARRIER_PATHS.dhl },
  { id: "fedex", name: "FedEx", tagline: "Priority & ground", path: CARRIER_PATHS.fedex },
  { id: "ups", name: "UPS", tagline: "Ground & air", path: CARRIER_PATHS.ups },
  { id: "usps", name: "USPS", tagline: "US Postal Service", path: CARRIER_PATHS.usps },
  { id: "amazon", name: "Amazon Shipping", tagline: "Amazon logistics", path: CARRIER_PATHS.amazon },
  { id: "dpd", name: "DPD", tagline: "European parcels", path: CARRIER_PATHS.dpd },
  { id: "tnt", name: "TNT", tagline: "Freight & express", path: CARRIER_PATHS.tnt },
  { id: "deutschepost", name: "Deutsche Post", tagline: "Germany", path: CARRIER_PATHS.deutschepost },
  { id: "hermes", name: "Hermes", tagline: "Germany parcels", path: CARRIER_PATHS.hermes },
  { id: "toll", name: "Toll", tagline: "Asia-Pacific freight", path: CARRIER_PATHS.toll },
  { id: "royalmail", name: "Royal Mail", tagline: "United Kingdom", mark: "RM" },
  { id: "evri", name: "Evri", tagline: "UK parcels", mark: "evri" },
  { id: "canadapost", name: "Canada Post", tagline: "Canada", mark: "CP" },
  { id: "purolator", name: "Purolator", tagline: "Canada courier", mark: "P" },
  { id: "auspost", name: "Australia Post", tagline: "Australia", mark: "AP" },
  { id: "gls", name: "GLS", tagline: "European parcels", mark: "GLS" },
  { id: "postnl", name: "PostNL", tagline: "Netherlands", mark: "NL" },
  { id: "inpost", name: "InPost", tagline: "Parcel lockers", mark: "IP" },
  { id: "aramex", name: "Aramex", tagline: "Middle East & Africa", mark: "ax" },
  { id: "sfexpress", name: "SF Express", tagline: "China & Asia", mark: "SF" },
  { id: "japanpost", name: "Japan Post", tagline: "Japan", mark: "〒" },
  { id: "other", name: "Other", tagline: "Local or private courier" },
];

export const DEFAULT_CARRIER: CarrierId = "swifttrack";

export function getCarrier(id?: string | null | undefined): Carrier {
  return CARRIERS.find((c) => c.id === id) ?? (CARRIERS[0] as Carrier);
}

/** Case-insensitive match on carrier name or tagline, for the picker search. */
export function searchCarriers(query: string): Carrier[] {
  const q = query.trim().toLowerCase();
  if (!q) return CARRIERS;
  return CARRIERS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q) || c.id.includes(q),
  );
}
