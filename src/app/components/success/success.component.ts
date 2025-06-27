import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonCard,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonIcon,
    IonButton
  ],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css'],
  animations: [
    // Simple scale-in animation when the component enters the view
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class SuccessComponent {
  constructor(private router: Router) {
    // Register the 'checkmark' icon for use in the template
    addIcons({ checkmark });
  }

  // Reset local data and navigate to the first step
  onFinish() {
    localStorage.removeItem('step1Data');
    localStorage.removeItem('step2Data');
    localStorage.removeItem('step3Data');
    this.router.navigate(['/step1']);
  }
}
