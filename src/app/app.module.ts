import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppComponent} from './app.component';
import {ViewerComponent} from './viewer/viewer.component';
import {TrustResourceUrlPipe} from './trust-resource-url.pipe';
import {ReaderComponent} from './reader/reader.component';
import {PageHeightPipe} from './page-height.pipe';
import {AppMenu} from "./lib/menu";
import {AppStorage} from "./lib/storage";
import {CoverService} from "./cover.service";
import {RenderService} from "./render.service";

@NgModule({
  declarations: [
    AppComponent,
    ViewerComponent,
    ReaderComponent,
    TrustResourceUrlPipe,
    PageHeightPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [AppMenu, AppStorage, RenderService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
