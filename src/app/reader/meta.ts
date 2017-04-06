export class PageMeta {
  Id: string;
  Name: string;
  Width: number;
  Height: number;
  Type: string;
}

export class BookMeta {
  Id: string;
  Locator: string;
  Name: string;
  Author: string;
  Publisher: string;
  Pages: PageMeta[]
}
