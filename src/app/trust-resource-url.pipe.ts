import {Pipe, PipeTransform} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";

@Pipe({
  name: 'trustResourceUrl'
})
export class TrustResourceUrlPipe implements PipeTransform {
  sanitizer: DomSanitizer;

  constructor(_s: DomSanitizer) {
    this.sanitizer = _s;
  }

  transform(value: any, args?: any): any {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

}
