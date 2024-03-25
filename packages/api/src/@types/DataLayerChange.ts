export interface DataLayerChange {
  action: 'delete' | 'insert';
  key: string;
  value?: string;
}
