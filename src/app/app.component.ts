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

  async ngOnInit() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    await args.wait();
    const path = args.path;
    console.log(1, this.path);
    if (!path) {
      this.onFail();
    } else {
      this.path = path;
    }
    // this.path = '/Users/shixiao/Pictures';
    // this.path = '/Users/shixiao/Downloads/a/top20/8';
  }

  onOk() {
    getCurrentWindow().show();
    console.log('ok');
  }

  onFail(e?) {
    console.warn('FAIL:', e);
    this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    this.refresh++;
  }
}
