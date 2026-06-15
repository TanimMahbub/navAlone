import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
// Ships the core stylesheet — `import "navalone/css"` in a real app.
import "navalone/css";
import { AppComponent } from "./app.component";

bootstrapApplication(AppComponent).catch((err) => console.error(err));
