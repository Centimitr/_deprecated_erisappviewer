import { ViewerPage } from './app.po';

describe('viewer App', () => {
  let page: ViewerPage;

  beforeEach(() => {
    page = new ViewerPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
