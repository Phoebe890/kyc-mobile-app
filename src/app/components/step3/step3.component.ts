import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { KycService } from '../../services/kyc.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
  styleUrls: ['./step3.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    StepProgressComponent,
    MatProgressSpinnerModule
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
    //creates a reactive form with a control called email
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Load saved data if any
    const savedData = localStorage.getItem('step3Data');
    if (savedData) {
      this.emailForm.patchValue(JSON.parse(savedData));
    }
  }

  onBack() {
    this.router.navigate(['/step2']);
  }

  onSubmit() {
    if (this.emailForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const email = this.emailForm.get('email')?.value;

      // Check if we have step1 data and it's completed
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
        console.log('Parsed step1 data:', parsedData);

        // Check if we have a valid customerId
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

        console.log('Submitting email for customerId:', customerId);

        this.kycService.submitEmail(email).subscribe({
          next: (response) => {
            console.log('Email submission response:', response);
            
            // Update the stored data to include email
            const updatedData = {
              ...parsedData,
              email: email,
              emailSubmitted: true
            };
            localStorage.setItem('step1Data', JSON.stringify(updatedData));
            
            // Save form data to localStorage
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
            this.snackBar.open('Error verifying email. Please try again.', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      } catch (error) {
        console.error('Error processing step1 data:', error);
        this.snackBar.open('Error processing your information. Please try step 1 again.', 'Close', {
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
}


