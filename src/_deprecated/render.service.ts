import {Injectable} from "@angular/core";
const {getCurrentWindow} = window['require']('electron').remote;

@Injectable()
export class RenderService {
  win: any;

  constructor() {
    this.win = getCurrentWindow();
  }

  stop() {
    this.win.webContents.stopPainting();
  }

  start() {
    this.win.webContents.startPainting();
  }

}
