export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface IscaboxSpot extends Coordinates {
  id: string;
  name: string;
  description?: string;
  distanceKm: number;
  sourceUrl?: string;
}

type JsonRecord = Record<string, unknown>;

interface IscaboxLocationCandidate {
  id: string;
  locationPath: string;
  name: string;
  description?: string;
  searchDistanceKm: number;
}

const ISCABOX_MCP_URL = 'https://www.iscabox.com/mcp';
let mcpRequestSequence = 0;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function numberFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function textFrom(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function coordinatesFrom(value: unknown, depth = 0): Coordinates | null {
  if (depth > 5) return null;
  if (typeof value === 'string') {
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const latitude = numberFrom(match[1]);
    const longitude = numberFrom(match[2]);
    if (latitude === null || longitude === null) return null;
    const coordinates = { latitude, longitude };
    return isValidCoordinates(coordinates) ? coordinates : null;
  }

  if (Array.isArray(value) && value.length >= 2) {
    const longitude = numberFrom(value[0]);
    const latitude = numberFrom(value[1]);
    if (latitude !== null && longitude !== null) {
      return isValidCoordinates({ latitude, longitude }) ? { latitude, longitude } : null;
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) return null;
  const latitude = numberFrom(record.latitude) ?? numberFrom(record.lat);
  const longitude =
    numberFrom(record.longitude) ??
    numberFrom(record.lng) ??
    numberFrom(record.lon) ??
    numberFrom(record.long);
  if (latitude !== null && longitude !== null) {
    const coordinates = { latitude, longitude };
    if (isValidCoordinates(coordinates)) return coordinates;
  }

  for (const key of [
    'coordinates',
    'coordinate',
    'coords',
    'position',
    'point',
    'geometry',
    'center',
    'location',
    'geo',
  ]) {
    const nested = coordinatesFrom(record[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function isValidCoordinates(value: Coordinates): boolean {
  return (
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function parseJsonCandidate(text: string): unknown | undefined {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const firstObject = trimmed.indexOf('{');
  const firstArray = trimmed.indexOf('[');
  const start =
    firstObject === -1
      ? firstArray
      : firstArray === -1
        ? firstObject
        : Math.min(firstObject, firstArray);
  if (start >= 0) {
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (end > start) candidates.push(trimmed.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      let parsed: unknown = candidate;
      for (let attempt = 0; attempt < 3 && typeof parsed === 'string'; attempt += 1) {
        parsed = JSON.parse(parsed) as unknown;
      }
      if (typeof parsed !== 'string') return parsed;
    } catch {
      // Try the next possible JSON fragment.
    }
  }
  return undefined;
}

function decodeMcpResponse(body: string): unknown {
  const direct = parseJsonCandidate(body);
  if (direct !== undefined) return direct;

  const events = body
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => parseJsonCandidate(line.slice(5)))
    .filter((event) => event !== undefined);
  const lastEvent = events[events.length - 1];
  if (lastEvent !== undefined) return lastEvent;
  throw new Error('A resposta da iscabox veio em um formato inesperado.');
}

function toolPayloadFromResponse(payload: unknown): unknown {
  const rpcResponse = asRecord(payload);
  if (rpcResponse?.error) {
    const rpcError = asRecord(rpcResponse.error);
    throw new Error(textFrom(rpcError ?? {}, ['message']) ?? 'A iscabox não conseguiu buscar os pontos.');
  }

  const result = asRecord(rpcResponse?.result) ?? rpcResponse;
  if (!result) throw new Error('A resposta da iscabox veio em um formato inesperado.');
  const content = Array.isArray(result.content) ? result.content : [];
  if (result.isError === true) {
    const message = content
      .map((item) => textFrom(asRecord(item) ?? {}, ['text']))
      .find((text) => text);
    throw new Error(message ?? 'A iscabox não conseguiu buscar os pontos.');
  }

  if (result.structuredContent !== undefined) return result.structuredContent;

  const parsedContent: unknown[] = [];
  for (const item of content) {
    const text = textFrom(asRecord(item) ?? {}, ['text']);
    if (text) {
      const parsed = parseJsonCandidate(text);
      if (parsed !== undefined) parsedContent.push(parsed);
    }
  }
  if (parsedContent.length === 1) return parsedContent[0];
  if (parsedContent.length > 1) return parsedContent;
  return result;
}

function extractLocationCandidates(payload: unknown): IscaboxLocationCandidate[] {
  const candidates: IscaboxLocationCandidate[] = [];
  const seen = new Set<string>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;

    const name = textFrom(record, ['name', 'title', 'locationName', 'spotName', 'label', 'local']);
    const locationPath = textFrom(record, ['locationPath', 'path', 'slug']);
    if (name && locationPath) {
      const id = textFrom(record, ['id']) ?? locationPath;
      if (!seen.has(id)) {
        seen.add(id);
        candidates.push({
          id,
          locationPath,
          name,
          description: textFrom(record, ['description', 'summary', 'city', 'municipality', 'kind', 'type']),
          searchDistanceKm: numberFrom(record.distanceKm) ?? Number.POSITIVE_INFINITY,
        });
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(payload);
  return candidates.sort((first, second) => first.searchDistanceKm - second.searchDistanceKm);
}

function sourceUrlFrom(record: JsonRecord): string | undefined {
  const links = Array.isArray(record.links) ? record.links : [];
  for (const link of links) {
    const linkRecord = asRecord(link);
    const url = textFrom(linkRecord ?? {}, ['url']);
    if (url) return url;
  }
  return textFrom(record, ['blogUrl']);
}

async function callIscaboxTool(name: string, args: JsonRecord): Promise<unknown> {
  const response = await fetch(ISCABOX_MCP_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${Date.now()}-${++mcpRequestSequence}`,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(
        retryAfter
          ? `Limite de buscas atingido. Tente novamente em ${retryAfter} segundos.`
          : 'Limite de buscas atingido. Tente novamente em instantes.',
      );
    }
    throw new Error(`Não foi possível consultar a iscabox (erro ${response.status}).`);
  }

  return toolPayloadFromResponse(decodeMcpResponse(await response.text()));
}

function extractLocationDetails(payload: unknown): JsonRecord | null {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const details = extractLocationDetails(item);
      if (details) return details;
    }
    return null;
  }

  const record = asRecord(payload);
  if (!record) return null;
  if (coordinatesFrom(record) && textFrom(record, ['name', 'title', 'locationName'])) return record;

  for (const value of Object.values(record)) {
    const details = extractLocationDetails(value);
    if (details) return details;
  }
  return null;
}

export function distanceInKilometers(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatSpotDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(1, Math.round(distanceKm * 1000))} m em linha reta`;
  return `${distanceKm.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })} km em linha reta`;
}

export async function fetchNearestIscaboxSpots(
  coordinates: Coordinates,
): Promise<IscaboxSpot[]> {
  const searchPayload = await callIscaboxTool('search_locations', {
    lat: coordinates.latitude,
    lng: coordinates.longitude,
    limit: 8,
  });
  const candidates = extractLocationCandidates(searchPayload);
  if (candidates.length === 0) return [];

  const detailResults = await Promise.allSettled(
    candidates.slice(0, 8).map(async (candidate) => {
      const detailPayload = await callIscaboxTool('get_location', {
        locationPath: candidate.locationPath,
      });
      const details = extractLocationDetails(detailPayload);
      const locationCoordinates = details ? coordinatesFrom(details) : null;
      if (!details || !locationCoordinates) return null;

      return {
        ...locationCoordinates,
        id: candidate.id,
        name: textFrom(details, ['name', 'title', 'locationName']) ?? candidate.name,
        description:
          textFrom(details, ['description', 'summary']) ?? candidate.description,
        distanceKm: distanceInKilometers(coordinates, locationCoordinates),
        sourceUrl: sourceUrlFrom(details),
      } satisfies IscaboxSpot;
    }),
  );

  const spots = detailResults.flatMap((result) =>
    result.status === 'fulfilled' && result.value ? [result.value] : [],
  );
  if (spots.length === 0) {
    const failedRequest = detailResults.find((result) => result.status === 'rejected');
    if (failedRequest?.status === 'rejected') throw failedRequest.reason;
    throw new Error('A iscabox encontrou locais, mas não retornou coordenadas para exibi-los.');
  }

  return spots.sort((first, second) => first.distanceKm - second.distanceKm).slice(0, 5);
}
