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
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';

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
    // Register icons for use in the template
    addIcons({
      mail,
      'mail-outline': mailOutline,
      'arrow-back': arrowBack,
      send
    });

    // Initialize the form with validators
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Load saved email form data from localStorage if available
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
          this.snackBar.open('Unable to find customer information. Please complete step 1 again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
          return;
        }

        // Submit the email to the backend service
        this.kycService.submitEmail(email).subscribe({
          next: (response) => {
            const updatedData = {
              ...parsedData,
              email: email,
              emailSubmitted: true,
            };

            // Save updated data and proceed to success page
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
            let errorMessage = 'Error verifying email. Please try again.';
            if (error?.error?.message) {
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
    // Allow navigation to previous steps
    if (step === 1) {
      this.router.navigate(['/step1']);
    } else if (step === 2) {
      this.router.navigate(['/step2']);
    }
  }
}
