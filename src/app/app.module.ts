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
import {DotComponent} from './asist/dot/dot.component';
import {CoverAboutComponent} from './cover/cover-about/cover-about.component';
import {CoverPreferencesComponent} from "./cover/cover-preferences/cover-preferences.component";
import {CoverLayerComponent} from './cover/cover-layer/cover-layer.component';
import {CoverService} from "./cover/cover-layer/cover.service";

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
    CoverPreferencesComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [CoverService, AppMenu, AppStorage, Config],
  bootstrap: [AppComponent]
})
export class AppModule {
}
