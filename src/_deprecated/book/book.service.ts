import {Injectable} from '@angular/core';
import {FileSystemService} from "../fs.service";
import {FileDriver} from "./driver";
import {Book} from "./book";


@Injectable()
export class BookService {

  constructor(private fs: FileSystemService) {
  }

  async create(path: string): Promise<Book> {
    const driver = new FileDriver(this.fs);
    const b = new Book(await driver.resolvePath(path));
    await b.init(driver);
    return b;
  }
}
