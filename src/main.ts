import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Make sure you define this

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
});
