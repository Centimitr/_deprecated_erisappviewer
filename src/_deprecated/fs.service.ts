import {Injectable} from "@angular/core";
import {FileSystem} from "./lib/fs";

@Injectable()
export class FileSystemService extends FileSystem {

  constructor() {
    super()
  }

}
