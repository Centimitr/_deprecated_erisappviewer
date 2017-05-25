import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";

import {AppComponent} from "./app.component";
import {TrustResourceUrlPipe} from "./trust-resource-url.pipe";
import {ReaderComponent} from "./reader/reader.component";
import {AppMenu} from "./lib/menu";
import {AppStorage} from "./lib/storage";
import {ImageComponent} from "./image/image.component";
import {ScrollComponent} from "./scroll/scroll.component";
import {Config} from "./config.service";
import {DotComponent} from './dot/dot.component';
import {CoverAboutComponent} from './cover-about/cover-about.component';
import {CoverLayerComponent} from './cover-layer/cover-layer.component';
import {CoverPreferenceComponent} from './cover-preference/cover-preference.component';

@NgModule({
  declarations: [
    AppComponent,
    ReaderComponent,
    TrustResourceUrlPipe,
    ImageComponent,
    ScrollComponent,
    DotComponent,
    CoverAboutComponent,
    CoverLayerComponent,
    CoverPreferenceComponent,
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
