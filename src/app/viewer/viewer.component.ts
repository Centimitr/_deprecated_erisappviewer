import {Component, OnInit, Input, OnChanges} from '@angular/core';
import {ImageMeta} from '../book/book';
const getWindowSize = () => {
  return [window.innerWidth, window.innerHeight];
};

@Component({
  selector: 'viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit, OnChanges {

  @Input() img: ImageMeta;
  @Input() scale: number;

  constructor() {
  }

  async ngOnInit() {
  }

  ngOnChanges(changes) {
    if (changes.img || changes.scale) {
      // console.timeEnd('overall');
    }
  }

  isX(img?: ImageMeta) {
    if (img) {
      const [w, h] = getWindowSize();
      return img.aspect > w / h;
    }
  }

  isTiny(img?: ImageMeta) {
    if (img) {
      const [w, h] = getWindowSize();
      return this.scale < 100 || (img.width < w && img.height < h);
    }
  }

  isHuge(img?: ImageMeta) {
    if (img) {
      const [w, h] = getWindowSize();
      const ratio = this.scale / 100;
      return img.width * ratio > w && img.height * ratio > h;
    }
  }

  max(img?: ImageMeta) {
    return this.isTiny(img) ? 100 : this.scale;
  }

  onLoad(e) {
    // console.log(e);
    // console.timeEnd('image load');
  }

}
