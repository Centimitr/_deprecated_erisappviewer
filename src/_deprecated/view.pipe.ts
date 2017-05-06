import {Pipe, PipeTransform} from '@angular/core';
import {Config} from "./config.service";

@Pipe({
  name: 'view'
})
export class ViewPipe implements PipeTransform {

  constructor(private config: Config) {
  }

  transform(pages: any, isSingleView: boolean, current: number): any {
    if (pages && isSingleView) {
      current = current || 1;
      return pages.filter((p, i) => i === current - 1);
    }else return pages;
  }
}
