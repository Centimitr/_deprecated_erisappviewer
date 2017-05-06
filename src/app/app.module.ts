import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppComponent} from './app.component';
import {TrustResourceUrlPipe} from './trust-resource-url.pipe';
import {ReaderComponent} from './reader/reader.component';
import {AppMenu} from "./lib/menu";
import {AppStorage} from "./lib/storage";
import {ImageComponent} from './image/image.component';
import {ScrollComponent} from './scroll/scroll.component';
import {Config} from "./config.service";

@NgModule({
  declarations: [
    AppComponent,
    ReaderComponent,
    TrustResourceUrlPipe,
    ImageComponent,
    ScrollComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [AppMenu, AppStorage, Config],
  bootstrap: [AppComponent]
})
export class AppModule {
}
