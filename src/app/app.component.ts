import {Component, NgZone, OnInit} from '@angular/core';
import args from "./lib/args";
const electron = window['require']('electron');
const {webFrame} = electron;
const {dialog, getCurrentWindow} = electron.remote;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  path: string;
  refresh: number = 0;

  constructor(private zone: NgZone) {

  }

  async ngOnInit() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    const win = getCurrentWindow();
    await args.wait();
    const path = args.path;
    console.warn('PATH:', path);
    this.zone.run(() => {
      this.path = path;
    })
    // if (path) {
    // }
    // check is user folder
    // check path has images
    // const isUserImagesFolder = false;
    // if (!this.path) {
    //   this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    // }
    // this.path = '/Users/shixiao/Pictures';
    // this.path = '/Users/shixiao/Downloads/a/top20/8';
    // win.show();
  }

  onFail(e) {
    console.warn('FAIL!', e);
    this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    this.refresh++;
  }
}
