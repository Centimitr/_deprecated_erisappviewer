import {Injectable} from "@angular/core";
export interface KeyValue<T, U> {
  key: T;
  value: U;
}

export class AppStorageValue {
  private v: any;
  private cached: boolean = false;
  private _onChange: Function[] = [];

  constructor(public k: string, private driver: AppStorage) {
  }

  get(defaultValue?: any) {
    if (!this.cached) {
      this.v = this.driver.read(this.k, defaultValue);
      this.cached = true;
    }
    return this.v;
  }

  set(v: any) {
    const old = this.v;
    this.v = v;
    this.cached = true;
    this.driver.write(this.k, v);
    if (old !== v) {
      this._onChange.forEach(cb => cb(v, old));
    }
  }

  onChange(cb: Function) {
    this._onChange.push(cb);
  }

  clearCache() {
    this.v = null;
    this.cached = false;
  }
}

@Injectable()
export class AppStorage {
  m = new Map<string, AppStorageValue>();
  s = window.localStorage;

  write(key: string, value: any) {
    return this.s.setItem(key, JSON.stringify(value));
  }

  read(key: string, defaultValue: any = null): any {
    const v = this.s.getItem(key);
    return JSON.parse(v !== null ? v : typeof defaultValue === 'string' ? defaultValue : JSON.stringify(defaultValue));
  }

  get(key: string) {
    const exists = this.m.has(key);
    if (!exists) {
      this.m.set(key, new AppStorageValue(key, this));
    }
    return this.m.get(key);
  }
}
