import {FileSystemService} from "../fs.service";

export interface Driver {
  resolvePath(path: string): Promise<string>;
  resolveMeta(path: string): Promise<any>;
  resolvePaths(path: string): Promise<string[]>;
  resolveImage(path: string): Promise<Buffer>;
}

export class FileDriver implements Driver {

  constructor(private fs: FileSystemService) {
  }

  async resolvePath(path: string): Promise<string> {
    const getParentPath = function (path: string) {
      return path.split('/').slice(0, -1).join('/');
    };
    return await this.fs.isDir(path) ? path : getParentPath(path);
  }

  async resolveMeta(path: string): Promise<any> {
    return {}
  }

  async resolvePaths(path: string): Promise<string[]> {
    return await this.fs.getDirImagePaths(path);
  }

  async resolveImage(path: string): Promise<Buffer> {
    return this.fs.readFile(path);
  };
}
