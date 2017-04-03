import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppComponent} from './app.component';
import {ViewerComponent} from './viewer/viewer.component';
import {FileSystemService} from './fs.service';
import {BookService} from './book/book.service';
import {TrustResourceUrlPipe} from './trust-resource-url.pipe';
import {ReaderComponent} from './reader/reader.component';

@NgModule({
  declarations: [
    AppComponent,
    ViewerComponent,
    ReaderComponent,
    TrustResourceUrlPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [
    FileSystemService,
    BookService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
