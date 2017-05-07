// import {Pipe, PipeTransform} from "@angular/core";
// import {PageMeta} from "./reader/meta";
//
// @Pipe({
//   name: 'pageHeight'
// })
// export class PageHeightPipe implements PipeTransform {
//
//   transform(p: PageMeta, args?: any): any {
//     const pages: HTMLElement = args[0];
//     const xScale = 100;
//     const yScale = args[1];
//     const [w, h] = [xScale / 100 * pages.offsetWidth, yScale / 100 * pages.offsetHeight];
//     const scale = Math.min(1, w / p.Width, h / p.Height);
//     return p.Height * scale;
//   }
//
// }
