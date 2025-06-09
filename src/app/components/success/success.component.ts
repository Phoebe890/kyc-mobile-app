import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css'],
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('500ms ease-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class SuccessComponent {
  constructor(private router: Router) {}

  onFinish() {
    // Clear all stored data
    localStorage.removeItem('step1Data');
    localStorage.removeItem('step2Data');
    localStorage.removeItem('step3Data');
    
    // Navigate back to step1
    this.router.navigate(['/step1']);
  }
}
