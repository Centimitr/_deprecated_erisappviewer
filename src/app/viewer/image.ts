// const electron = window['require']('electron');
// const {nativeImage} = electron;
//
// export class ViewerImage {
//   src: string;
//   aspect: number = 1;
//   width: number = 100;
//   height: number = 100;
//   scale: number;
//
//   constructor(buf: Buffer) {
//     const blob = new Blob([buf]);
//     this.src = URL.createObjectURL(blob);
//     // let img = nativeImage.createFromBuffer(buf);
//     // const size = img.getSize();
//     // [this.width, this.height] = [size.width, size.height];
//     // this.aspect = img.getAspectRatio();
//     // img = null;
//   }
//
//   revoke() {
//     URL.revokeObjectURL(this.src);
//   }
//
//   setScale(s: number) {
//     this.scale = s;
//   }
// }
