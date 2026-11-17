export interface Schedule {
  days: string[];
  start: string;
  end: string;
  note: string;
}

export interface Photo {
  url: string;
  content_type: string;
  filename: string;
}

export interface StoredPhoto {
  object_key: string;
  content_type: string;
  filename: string;
}

export type Kind = 'veggie' | 'other';

export interface Stop {
  id: string;
  address: string;
  schedule: Schedule;
}

export interface Item {
  id: string;
  kind: Kind;
  name: string;
  price: number;
  unit: string;
  photo: Photo;
}

export interface Cart {
  id: string;
  name: string;
  token?: string;
  stops: Stop[];
  items: Item[];
  loaded: boolean;
  created_at: string;
}

export interface Line {
  itemId: string;
  kind: Kind;
  name: string;
  price: number;
  unit: string;
  qty: number;
}

export interface SlipLine {
  item_id: string;
  kind: Kind;
  name: string;
  price: number;
  unit: string;
  qty: number;
}

export interface Slip {
  id: string;
  driver_token: string;
  cart_id: string;
  cart_name: string;
  schedule: Schedule;
  address: string;
  lines: SlipLine[];
  total: number;
  status: 'open' | 'arrived';
  created_at: string;
}

export type Role = 'entity' | 'loader' | 'cart' | 'driver';

export interface OrderLine {
  item_id: string;
  qty: number;
}
