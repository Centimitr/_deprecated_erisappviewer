import {Component, OnInit} from '@angular/core';
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

  constructor() {

  }

  async ngOnInit() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    const win = getCurrentWindow();
    await args.wait();
    const path = args.path;
    console.log('Open From FileAssociation:', path);
    if (path) {
      this.path = path;
    }
    // check is user folder
    // check path has images
    // const isUserImagesFolder = false;
    if (this.path) {
      this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    }
    // this.path = '/Users/shixiao/Pictures';
    // this.path = '/Users/shixiao/Downloads/a/top20/8';
    win.show();
  }
}
