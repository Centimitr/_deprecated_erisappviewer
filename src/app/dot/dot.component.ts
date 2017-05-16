import {Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'cm-dot',
  templateUrl: './dot.component.html',
  styleUrls: ['./dot.component.css']
})
export class DotComponent implements OnInit, OnDestroy {

  @Input() word: string;
  @Input() interval: number;
  timer: any;
  elm: any;

  constructor(elm: ElementRef) {
    this.elm = elm.nativeElement;
  }

  ngOnInit() {
    let times = 0;
    this.timer = setInterval(() => {
      times++;
      const dots = (new Array(3))
        .fill(false).map((v, i) => i < times % 4)
        .map(v => `<span style="opacity: ${v ? 1 : 0}">.</span>`)
        .join('');
      this.elm.querySelector('span').innerHTML = dots;
    }, this.interval)
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

}
