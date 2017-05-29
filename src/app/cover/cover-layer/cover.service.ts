import {Injectable, NgZone} from '@angular/core';
const electron = window['require']('electron');
const {getCurrentWindow} = electron.remote;
const forEach = (obj: object) => {
  return Object.keys(obj).map(k => ({k: k, v: obj[k]}))
};

@Injectable()
export class CoverService {

  backdropShow: boolean = false;
  states: any = {
    about: false,
    preferences: false,
  };
  r: Function;

  constructor(private z: NgZone) {
    this.r = fn => {
      this.z.run(fn)
    };
  }

  private _show(name: string) {
    this.r(() => {
      getCurrentWindow().show();
      this.backdropShow = true;
      const showing = forEach(this.states).filter(kv => kv.v).pop();
      let timeout = 0;
      if (showing && showing.k != name) {
        this.states[showing.k] = false;
        timeout = 150;
      }
      setTimeout(() => this.states[name] = true, timeout)
    });
  }

  showAbout() {
    this._show('about');
  }

  showPreferences() {
    this._show('preferences');
  }

  dismissAll() {
    this.r(() => {
      Object.keys(this.states).forEach(k => this.states[k] = false);
      this.backdropShow = false;
    });
  }
}
