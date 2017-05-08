export class PageMeta {
  Locator: string;
  SubBook: string;
  Name: string;
  Width: number;
  Height: number;
  Type: string;
}

export class BookMeta {
  Locator: string;
  Name: string;
  Author: string;
  Publisher: string;
  Pages: PageMeta[];
  LastRead: string;
}
