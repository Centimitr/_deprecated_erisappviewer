const _fs = window['require']('fs');
const path = require('path');
const _0777 = parseInt('0777', 8);
function mkdirP(p: string, opts: Object, f?: Function, made?: any) {
  let mode;
  let xfs = _fs;

  if (mode === undefined) {
    mode = _0777 & (~process.umask());
  }
  if (!made) made = null;

  let cb = f || function () {
    };
  p = path.resolve(p);

  xfs.mkdir(p, mode, function (er) {
    if (!er) {
      made = made || p;
      return cb(null, made);
    }
    switch (er.code) {
      case 'ENOENT':
        mkdirP(path.dirname(p), opts, function (er, made) {
          if (er) cb(er, made);
          else mkdirP(p, opts, cb, made);
        });
        break;
      default:
        xfs.stat(p, function (er2, stat) {
          if (er2 || !stat.isDirectory()) cb(er, made);
          else cb(null, made);
        });
        break;
    }
  });
}

class Basic {
  native: any = _fs;

  async readFile(path: string): Promise<any> {
    return new Promise<any>(function (resolve, reject) {
      _fs.readFile(path, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  async stats(path: string): Promise<any> {
    return new Promise(function (resolve, reject) {
      _fs.stat(path, function (err, stats) {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      })
    })
  }

  async readDir(path: string): Promise<string[]> {
    return new Promise<string[]>(function (resolve, reject) {
      _fs.readdir(path, function (err, files) {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }

  async mkdir(path: string): Promise<any> {
    return new Promise(function (resolve, reject) {
      _fs.mkdir(path, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    })
  }

  async mkdirp(path: string): Promise<any> {
    return new Promise(function (resolve, reject) {
      mkdirP(path, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    })
  }

  async isFile(path: string) {
    const stats = await this.stats(path);
    return stats.isFile();
  }

  async isDir(path: string) {
    const stats = await this.stats(path);
    return stats.isDirectory();
  }
}

export class FileSystem extends Basic {

  async filterDirPaths(paths: string[]): Promise<string[]> {
    const isDirs = await Promise.all(paths.map(path => this.isDir(path)));
    const filtered = [];
    paths.forEach((path, i) => {
      if (isDirs[i]) {
        filtered.push(path);
      }
    });
    return filtered;
  }

  async filterExtPaths(paths: string[], exts: string[], onlyName: boolean = false): Promise<string[]> {
    const isDirs = await Promise.all(paths.map(path => this.isFile(path)));
    let filtered = [];
    paths.forEach((path, i) => {
      if (isDirs[i] && exts.indexOf(path.split('.').pop().toLowerCase()) >= 0) {
        filtered.push(path);
      }
    });
    if (onlyName) {
      filtered = filtered.map(p => p.split('/').pop());
    }
    return filtered;
  }

  async filterImagePaths(paths: string[], onlyName: boolean = false): Promise<string[]> {
    return this.filterExtPaths(paths, ['png', 'jpg', 'jpeg', 'gif', 'tiff'], onlyName);
  }

  async getDirImagePaths(path: string): Promise<string[]> {
    const files = await this.readDir(path);
    const paths = files.map(name => [path, name].join('/'));
    return await this.filterImagePaths(paths);
  }

  async getDirImageNum(path: string): Promise<number> {
    const paths = await this.getDirImagePaths(path);
    return paths.length;
  }

  async isDirHasImage(path: string): Promise<boolean> {
    let num = await this.getDirImageNum(path);
    return !!num;
  }

  async filterHasImageDirPaths(paths: string[]): Promise<string[]> {
    const has = await Promise.all(paths.map(path => this.isDirHasImage(path)));
    return paths.filter((p, i) => has[i]);
  }

  async getSubDirPaths(path: string): Promise<string[]> {
    const files = await this.readDir(path);
    const paths = files.map(name => [path, name].join('/'));
    return this.filterDirPaths(paths);
  }

  async getSubDirPathsr(paths: string[], depth: number = 3): Promise<string[]> {
    const flat = function (arr: any[][]): any[] {
      let flatted = [];
      arr.forEach(a => {
        if (a instanceof Array) {
          flatted = flatted.concat(a);
        }
      });
      return flatted;
    };
    let dirs: string[] = [].concat(paths);
    for (let d = 0; d < depth; d++) {
      const subs = await Promise.all(paths.map(path => this.getSubDirPaths(path)));
      paths = flat(subs);
      dirs = dirs.concat(paths);
    }
    return dirs;
  }
}

export const fs = new FileSystem();
