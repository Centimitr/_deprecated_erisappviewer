import {Component} from '@angular/core';
const electron = window['require']('electron');
const {webFrame} = electron;
const {dialog, getCurrentWindow} = electron.remote;
const qs = require('querystring');


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  path: string;

  constructor() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    const win = getCurrentWindow();
    const entry = JSON.parse(qs.parse(location.search.slice(1)).entry);
    const path = entry.path;
    // check is user folder
    // check path has images
    // const isUserImagesFolder = false;
    const isUserImagesFolder = true;
    if (isUserImagesFolder) {
      this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    }
    // this.path = '/Users/shixiao/Pictures';
    win.show();
  }
}
