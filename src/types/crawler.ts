export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'script' | 'file';
  config: Record<string, unknown>;
  createdAt: string;
}

export interface ImportResult {
  success: boolean;
  count: number;
}
