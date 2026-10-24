import axios, { AxiosError } from 'axios';
import type { FarmerDetails, GeocodeResult, Report } from '../types';

const client = axios.create({ baseURL: '/api' });

export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const message = (err.response?.data as { error?: string } | undefined)?.error;
    if (message) return message;
    if (!err.response) return "Can't reach SoilSense right now. Check your connection and try again.";
  }
  return 'Something went wrong. Try again in a minute.';
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const { data } = await client.get<GeocodeResult[]>('/geocode', { params: { q: query } });
  return data;
}

export interface ReportRequest {
  lat: number;
  lng: number;
  place?: string;
  details?: FarmerDetails;
}

export async function fetchReport(request: ReportRequest): Promise<Report> {
  const { data } = await client.post<Report>('/report', request);
  return data;
}
