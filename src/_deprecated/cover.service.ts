import {Injectable} from '@angular/core';
const {dialog, getCurrentWindow, Menu, MenuItem} = window['require']('electron').remote;

@Injectable()
export class CoverService {
  dataUrl: string;
  show: boolean = false;
  scale: number = 100;

  constructor() {
  }

  async create() {
    // const win = getCurrentWindow();
    // console.log(1);
    // const img: any = await new Promise(r => win.webContents.on('paint', (event, dirty, image) => {
    //   console.log(2);
    //   console.log(event);
    //   r();
    // }));
    // console.log(3);
    // this.dataUrl = img.toDataURL();
    // this.show = true;
    getCurrentWindow().webContents.stopPaiting();
  }

  destroy() {
    getCurrentWindow().webContents.startPainting();
    // this.show = false;
    // this.dataUrl = null;
  }
}
