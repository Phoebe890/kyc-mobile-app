import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import {
  IonCard,
  IonIcon,
  IonItem,
  // IonLabel is not used in the template, so it's removed
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';

// 1. Import addIcons and the specific icons needed for this component
import { addIcons } from 'ionicons';
import { mail, mailOutline, arrowBack, send } from 'ionicons/icons';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { KycService } from '../../services/kyc.service';


@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
  styleUrls: ['./step3.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonCard,
    IonIcon,
    IonItem,
    IonInput,
    IonButton,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StepProgressComponent
  ]
})
export class Step3Component implements OnInit {
  emailForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private kycService: KycService
  ) {
    // 2. Register the icons in the constructor to make them available to the template
    addIcons({
      mail,
      'mail-outline': mailOutline,
      'arrow-back': arrowBack,
      send
    });

    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    const savedData = localStorage.getItem('step3Data');
    if (savedData) {
      try {
          this.emailForm.patchValue(JSON.parse(savedData));
      } catch (error) {
          console.error('Error parsing saved data for step 3:', error);
          localStorage.removeItem('step3Data');
      }
    }
  }

  onBack() {
    this.router.navigate(['/step2']);
  }

  onSubmit() {
    this.emailForm.get('email')?.markAsTouched();

    if (this.emailForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const email = this.emailForm.get('email')?.value;

      const step1Data = localStorage.getItem('step1Data');
      if (!step1Data) {
        console.error('Step 1 data not found.');
        this.snackBar.open('Please complete step 1 first', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
        return;
      }

      try {
        const parsedData = JSON.parse(step1Data);

        const customerId = parsedData.customerId;
        if (!customerId) {
          console.error('No customerId found in step1Data:', parsedData);
          this.snackBar.open('Unable to find customer information. Please complete step 1 again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
          return;
        }

        // Pass only the email string to the service
        this.kycService.submitEmail(email).subscribe({
          next: (response) => {
            console.log('Email submission response:', response);

            const updatedData = {
              ...parsedData,
              email: email,
              emailSubmitted: true,
            };
            localStorage.setItem('step1Data', JSON.stringify(updatedData));
            localStorage.setItem('step3Data', JSON.stringify(this.emailForm.value));

            this.router.navigate(['/success']).then(() => {
              this.snackBar.open('Email verification completed successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            });
          },
          error: (error) => {
            console.error('Error submitting email:', error);
             let errorMessage = 'Error verifying email. Please try again.';
             if (error && error.error && error.error.message) {
                 errorMessage = error.error.message;
             } else if (error.status === 409) {
                 errorMessage = 'This email is already registered.';
             }

            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      } catch (error) {
        console.error('Error processing step1 data or submitting email:', error);
        this.snackBar.open('An error occurred. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
      }
    } else {
      this.snackBar.open('Please enter a valid email address', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  onStepClick(step: number) {
     if (step === 1) {
        this.router.navigate(['/step1']);
     } else if (step === 2) {
        this.router.navigate(['/step2']);
     }
  }
}