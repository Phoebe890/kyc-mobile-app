import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { KycService } from '../../services/kyc.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    StepProgressComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './step2.component.html',
  styleUrls: [
    '../../shared/styles/kyc-form.scss',
    './step2.component.css'
  ]
})
export class Step2Component implements OnInit {
  //form groups for ID and selfie
  idForm!: FormGroup;
  documentForm!: FormGroup;
  //image preview data
  previews: { [key: string]: string } = {
    front: '',
    back: ''
  };
  selfiePreview: string | null = null;
  currentStep: number = 2;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private kycService: KycService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
//initialize from group with validation
    this.idForm = this.formBuilder.group({
      frontPhoto: ['', Validators.required],
      backPhoto: ['', Validators.required]
    });
    this.documentForm = this.formBuilder.group({
      selfie: [null, Validators.required]
    });

    // Load saved data if available
    this.loadSavedData();
  }
//handles selection of front and back images
  onFileSelected(event: any, type: 'front' | 'back') {
    const file = event.target.files[0];
    if (file) {
      if (this.isValidImage(file)) {
        this.isLoading = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previews[type] = e.target.result;
          // Update the form control with the File object
          const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
          this.idForm.get(controlName)?.setValue(file);//store file in form control
          console.log(`Set ${controlName}:`, file); // Debug log
          this.isLoading = false;
        };
        reader.onerror = () => {
          this.snackBar.open('Error loading image. Please try again.', 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('Please upload a valid image file (JPG, PNG)', 'Close', {
          duration: 3000
        });
      }
    }
  }
//removes front/back ID image and resets the control
  removeImage(type: 'front' | 'back') {
    this.previews[type] = '';
    this.idForm.patchValue({
      [type + 'Photo']: null
    });
    // Reset the file input
    const input = document.querySelector(`input[type="file"][accept="image/*"]`) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }
//checks if the uploaded file is a supported image type
  private isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    return validTypes.includes(file.type);
  }
//handles selfie file input and preview
  onSelfieSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (this.isValidImage(file)) {
        this.previewSelfie(file);
        // Update the form control with the File object
        this.documentForm.get('selfie')?.setValue(file);
        console.log('Set selfie:', file); // Debug log
      } else {
        this.snackBar.open('Please upload a valid image file (JPG, PNG)', 'Close', {
          duration: 3000
        });
      }
    }
  }
//generates selfie preview from file
  private previewSelfie(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.selfiePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
//clears selfie preview and resets the form value
  removeSelfie() {
    this.selfiePreview = null;
    this.documentForm.patchValue({ selfie: null });
  }

  onBack() {
    this.router.navigate(['/step1']);
  }

  onNext() {
    if (this.idForm.valid && this.documentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
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

        // Create FormData for document upload
        const formData = new FormData();
        const frontPhoto = this.idForm.get('frontPhoto')?.value;
        const backPhoto = this.idForm.get('backPhoto')?.value;
        const selfie = this.documentForm.get('selfie')?.value;

        // Append files with the correct field names expected by the backend
        if (frontPhoto) formData.append('frontPhotoId', frontPhoto);
        if (backPhoto) formData.append('backPhotoId', backPhoto);
        if (selfie) formData.append('selfieImage', selfie);

        console.log('Submitting documents for customerId:', customerId);
        console.log('Form data being sent:', {
          frontPhoto: frontPhoto?.name,
          backPhoto: backPhoto?.name,
          selfie: selfie?.name
        });

        // Submit documents
        this.kycService.submitDocuments(formData).subscribe({
          next: (response) => {
            console.log('Documents uploaded successfully:', response);
            // Update the stored data to include document submission status
            const updatedData = {
              ...parsedData,
              documentsSubmitted: true
            };
            localStorage.setItem('step1Data', JSON.stringify(updatedData));
            
            this.snackBar.open('Documents uploaded successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/step3']);
          },
          error: (error) => {
            console.error('Error uploading documents:', error);
            this.snackBar.open('Error uploading documents. Please try again.', 'Close', {
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
      this.markFormGroupTouched(this.idForm);
      this.markFormGroupTouched(this.documentForm);
      this.snackBar.open('Please upload all required documents', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private loadSavedData() {
    const savedData = localStorage.getItem('step2Data');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      this.idForm.patchValue(parsedData.idData);
      this.documentForm.patchValue(parsedData.documentData);
      this.selfiePreview = parsedData.documentData.selfiePreview;
      this.previews['front'] = parsedData.documentData.frontPhotoPreview;
      this.previews['back'] = parsedData.documentData.backPhotoPreview;
    }
  }

  navigateToStep(step: number) {
    // Prevent navigation to step 3 if current step is not complete
    if (step === 3 && !this.documentForm.valid) {
      this.snackBar.open('Please complete the current step first', 'Close', {
        duration: 3000
      });
      return;
    }

    // Check for unsaved changes
    if (this.documentForm.dirty || this.idForm.dirty) {
      const confirm = window.confirm('You have unsaved changes. Do you want to leave this page?');
      if (!confirm) {
        return;
      }
    }

    // Save Step 2 data as draft
const step2Draft = {
  idData: this.idForm.value,
  documentData: {
    ...this.documentForm.value,
    selfiePreview: this.selfiePreview,
    frontPhotoPreview: this.previews['front'],
    backPhotoPreview: this.previews['back']
  }
};
localStorage.setItem('step2Data', JSON.stringify(step2Draft));

    // Navigate to selected step
    this.router.navigate([`/step${step}`]);
  }

  onStepClick(step: number) {
    switch (step) {
      case 1:
        this.router.navigate(['/step1']);
        break;
      case 2:
        // Already on step 2
        break;
      case 3:
        this.router.navigate(['/step3']);
        break;
    }
  }
}
