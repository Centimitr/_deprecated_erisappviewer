import {Component, OnInit} from '@angular/core';
import {CoverService} from "./cover.service";

@Component({
  selector: 'cover-layer',
  templateUrl: './cover-layer.component.html',
  styleUrls: ['./cover-layer.component.css'],
})
export class CoverLayerComponent implements OnInit {

  constructor(private s: CoverService) {
  }

  ngOnInit() {
  }

}
