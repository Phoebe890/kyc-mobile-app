import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmark,
  person,
  idCard,
  camera,
  mail,
  timeOutline,
  arrowForward
} from 'ionicons/icons';

@Component({
  selector: 'app-welcome',//defines the html tag for the component
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {//starts the component class
  constructor(private router: Router) {
    // Register the icons
    addIcons({
      shieldCheckmark,
      person,
      idCard,
      camera,
      mail,
      timeOutline,
      arrowForward
    });
  }

  onContinue() {
    this.router.navigate(['/step1']);
  }
} 