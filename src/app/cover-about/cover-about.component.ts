import {Component, OnInit} from '@angular/core';
import credits from "./credits";
@Component({
  selector: 'cover-about',
  templateUrl: './cover-about.component.html',
  styleUrls: ['./cover-about.component.css', './about.css', './credits.css']
})
export class CoverAboutComponent implements OnInit {

  private creditShow: boolean = false;
  private credits: any[] = [];

  constructor() {
  }

  ngOnInit() {
    this.credits = credits;
  }

  showCredit() {
    this.creditShow = true;
  }

  hideCredit() {
    this.creditShow = false;
  }

  open(url: string) {
    window['require']('electron').shell.openExternal(url);
  }
}
