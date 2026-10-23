import axios from 'axios';
import type { FieldDetail, FieldSummary } from '../types';

const client = axios.create({ baseURL: '/api' });

export async function fetchFields(): Promise<FieldSummary[]> {
  const { data } = await client.get<FieldSummary[]>('/fields');
  return data;
}

export async function fetchFieldDetail(id: string): Promise<FieldDetail> {
  const { data } = await client.get<FieldDetail>(`/fields/${id}`);
  return data;
}
