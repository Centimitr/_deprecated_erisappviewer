import {extract} from "@fknop/node-unrar/lib";
import {fs} from "./fs";
const os = require('os');
const _path = require('path');
const uuid = require('uuid');
// const spawn = require('child_process').spawn;


export class Unfold {
  dirName: string = 'com.devbycm.enta.imgCache';

  async extract(srcPath: string, dstPath: string) {
    const ext = _path.extname(srcPath);
    console.log(ext);
    switch (ext) {
      case '.rar':
        //       await extract(srcPath, {
        //         dest: dstPath
        //       });
        break;
      case '.zip':
        // const ls = spawn('unzip', ['-lh', '/usr']);
        break;
    }
  }

  async unfold(srcPath: string) {
    const id = uuid();
    const path = _path.resolve(os.tmpdir(), this.dirName, id);
    console.log(await fs.mkdirp(path));
    // await this.extract(srcPath, path);
    return path;
  }
}

export default new Unfold();
// e.unfold('/Users/shixiao/Desktop/a.zip').then((path) => {
//   console.log('completed.');
//   console.log(path);
// });
