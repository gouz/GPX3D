type GeoJSONGeometry =
  | GeoJSON.Point
  | GeoJSON.LineString
  | GeoJSON.MultiLineString;

type GeoJSONFeature = GeoJSON.Feature<GeoJSONGeometry, Record<string, any>>;

function textOf(el: Element | null): string | undefined {
  if (!el) return undefined;
  const txt = el.textContent;
  return txt?.trim() === "" ? undefined : txt?.trim();
}

function parseNumber(s?: string | null): number | undefined {
  if (s == null) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseLatLon(el: Element): [number, number] {
  const lat = parseNumber(el.getAttribute("lat")) ?? NaN;
  const lon = parseNumber(el.getAttribute("lon")) ?? NaN;
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error("Invalid lat/lon on element");
  }
  return [lon, lat];
}

function parsePointElement(ptEl: Element) {
  const coords = parseLatLon(ptEl);
  const ele = textOf(ptEl.querySelector("ele"));
  const time = textOf(ptEl.querySelector("time"));
  const name = textOf(ptEl.querySelector("name"));
  const desc = textOf(ptEl.querySelector("desc"));
  const props: Record<string, any> = {};
  if (name) props.name = name;
  if (desc) props.desc = desc;
  if (time) props.time = time;
  if (ele) {
    const e = parseNumber(ele);
    if (e !== undefined) props.ele = e;
  }
  // copy simple extensions (first-level children of <extensions>)
  const ext = ptEl.querySelector("extensions");
  if (ext) {
    const extObj: Record<string, any> = {};
    for (let i = 0; i < ext.childNodes.length; i++) {
      const c = ext.childNodes[i];
      if (c.nodeType === 1) {
        const el = c as Element;
        const key = el.nodeName;
        extObj[key] = textOf(el) ?? true;
      }
    }
    if (Object.keys(extObj).length) props.extensions = extObj;
  }
  return { coords, props };
}

export function gpxToGeoJSON(input: string): GeoJSON.FeatureCollection {
  const xmlStr = input;
  const parser = new DOMParser();
  // parse as XML
  const doc = parser.parseFromString(xmlStr, "application/xml");

  // basic error detection
  const parserError = doc.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    // node xmldom may not yield 'parsererror'; still try to detect common issues
    const errText = parserError[0].textContent || "XML parse error";
    throw new Error("Failed to parse GPX: " + errText);
  }

  const features: GeoJSONFeature[] = [];

  // parse waypoints (wpt) -> Point features
  const wpts = Array.from(doc.getElementsByTagName("wpt"));
  for (const wpt of wpts) {
    try {
      const { coords, props } = parsePointElement(wpt);
      const feat: GeoJSONFeature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: coords },
        properties: props,
      };
      features.push(feat);
    } catch (e) {
      // skip invalid points
      continue;
    }
  }

  // parse routes (rte) -> LineString (one feature per rte)
  const rtes = Array.from(doc.getElementsByTagName("rte"));
  for (const rte of rtes) {
    const name = textOf(rte.querySelector("name"));
    const desc = textOf(rte.querySelector("desc"));
    const props: Record<string, any> = {};
    if (name) props.name = name;
    if (desc) props.desc = desc;

    const rtepts = Array.from(rte.getElementsByTagName("rtept"));
    const coordinates: number[][] = [];
    for (const pt of rtepts) {
      try {
        const { coords } = parsePointElement(pt);
        coordinates.push(coords);
      } catch {
        continue;
      }
    }

    if (coordinates.length === 1) {
      const feat: GeoJSONFeature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: coordinates[0] },
        properties: props,
      };
      features.push(feat);
    } else if (coordinates.length > 1) {
      const feat: GeoJSONFeature = {
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: props,
      };
      features.push(feat);
    }
  }

  // parse tracks (trk) -> LineString (one feature per trk; if multiple segments, MultiLineString)
  const trks = Array.from(doc.getElementsByTagName("trk"));
  for (const trk of trks) {
    const name = textOf(trk.querySelector("name"));
    const desc = textOf(trk.querySelector("desc"));
    const props: Record<string, any> = {};
    if (name) props.name = name;
    if (desc) props.desc = desc;

    const segments = Array.from(trk.getElementsByTagName("trkseg"));
    const allSegCoords: number[][][] = [];

    for (const seg of segments) {
      const pts = Array.from(seg.getElementsByTagName("trkpt"));
      const coords: number[][] = [];
      for (const pt of pts) {
        try {
          const { coords: c } = parsePointElement(pt);
          coords.push(c);
        } catch {
          continue;
        }
      }
      if (coords.length > 0) allSegCoords.push(coords);
    }

    if (allSegCoords.length === 0) continue;

    let geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
    if (allSegCoords.length === 1) {
      geometry = { type: "LineString", coordinates: allSegCoords[0] };
    } else {
      geometry = { type: "MultiLineString", coordinates: allSegCoords };
    }

    const feat: GeoJSONFeature = {
      type: "Feature",
      geometry,
      properties: props,
    };
    features.push(feat);
  }

  // if no features found, try fallback: consider <trkpt> or <rtept> or <wpt> anywhere (already covered mostly)
  return {
    type: "FeatureCollection",
    features,
  };
}

export default gpxToGeoJSON;
