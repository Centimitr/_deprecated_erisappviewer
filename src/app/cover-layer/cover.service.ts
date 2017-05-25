import {Injectable, NgZone} from '@angular/core';
const electron = window['require']('electron');
const {getCurrentWindow} = electron.remote;

@Injectable()
export class CoverService {

  backdropShow: boolean = false;
  states: any = {
    about: false,
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
      this.states[name] = true;
      this.backdropShow = true;
    });
  }

  showAbout() {
    this._show('about');
  }

  dismissAll() {
    this.r(() => {
      Object.keys(this.states).forEach(k => this.states[k] = false);
      this.backdropShow = false;
    });
  }
}
