import {Component, OnInit} from '@angular/core';
import credits from "./credits";
@Component({
  selector: 'cover-about',
  templateUrl: './cover-about.component.html',
  styleUrls: ['./cover-about.component.css']
})
export class CoverAboutComponent implements OnInit {

  private creditShow: boolean = false;

  constructor() {
  }

  ngOnInit() {
    const c = Object.keys(credits).map(k => credits[k]);
  }

  showCredit() {
    this.creditShow = true;
  }

  hideCredit() {
    this.creditShow = false;
  }
}
