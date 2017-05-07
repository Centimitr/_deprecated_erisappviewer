import {Component, ElementRef, EventEmitter, OnInit, Output} from "@angular/core";

@Component({
  selector: 'mark',
  templateUrl: './mark.component.html',
  styleUrls: ['./mark.component.css']
})
export class MarkComponent implements OnInit {
  elm: any;
  inView: boolean = false;
  @Output() enter = new EventEmitter<null>();
  @Output() leave = new EventEmitter<null>();

  constructor(elm: ElementRef) {
    this.elm = elm.nativeElement;
  }

  ngOnInit() {
    const io = new IntersectionObserver(() => {
      this.inView = !this.inView;
      if (this.inView) this.enter.emit();
      else this.leave.emit();
    });
    io.observe(this.elm);
  }
}
