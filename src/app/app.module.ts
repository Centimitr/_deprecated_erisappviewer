import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppComponent} from './app.component';
import {ViewerComponent} from './viewer/viewer.component';
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
