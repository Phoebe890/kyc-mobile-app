import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
 template: `
    <h1>Hello, {{ title }}</h1>
    <router-outlet></router-outlet>
  `,
  styles: [],
  standalone: true,
  imports: [RouterModule]
})
export class AppComponent {
  title = 'kyc';
}
