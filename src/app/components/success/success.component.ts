import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';

// --- UPDATED: Import Ionic components instead of Angular Material ---
import {
  IonContent,
  IonCard,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';

// --- ADDED: Import and register the 'checkmark' icon ---
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [
    CommonModule,
    // --- UPDATED: Use Ionic components in the imports array ---
    IonContent,
    IonCard,
    IonIcon,
    IonButton
  ],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css'],
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)' })) // Smoother ease
      ])
    ])
  ]
})
export class SuccessComponent {
  constructor(private router: Router) {
    // Register the icon so it can be used in the template
    addIcons({ checkmark });
  }

  onFinish() {
    // Clear all stored data
    localStorage.removeItem('step1Data');
    localStorage.removeItem('step2Data');
    localStorage.removeItem('step3Data');
    
    // Navigate back to the beginning
    this.router.navigate(['/step1']);
  }
}