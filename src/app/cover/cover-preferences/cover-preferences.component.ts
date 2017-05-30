import {Component, OnInit} from '@angular/core';
import {AppStorage} from "../../lib/storage";
const equal = function (base: object, toCheck: object): boolean {
  const keys = Object.keys(base);
  return keys.map(k => ({k: k, v: base[k]}))
      .map(kv => toCheck[kv.k] === kv.v)
      .filter(v => v).length === keys.length;
};
const DEFAULT_CONFIG = {
  submitData: true,
  rarPasswords: '⑨ qwertyuiop 扶她奶茶'
};

@Component({
  selector: 'cover-preferences',
  templateUrl: './cover-preferences.component.html',
  styleUrls: ['./cover-preferences.component.css']
})
export class CoverPreferencesComponent implements OnInit {

  private c: any;
  private _pc: any;

  constructor(private s: AppStorage) {
    this._pc = this.s.get('preferences.config');
    this.c = this._pc.get(Object.assign({}, DEFAULT_CONFIG));
  }

  ngOnInit() {
  }

  save() {
    this.c.rarPasswords = this.c.rarPasswords.trim();
    this._pc.set(this.c);
  }

  canReset(): boolean {
    return !equal(DEFAULT_CONFIG, this.c);
  }

  reset() {
    this.c = Object.assign({}, DEFAULT_CONFIG);
    this.save();
  }
}
