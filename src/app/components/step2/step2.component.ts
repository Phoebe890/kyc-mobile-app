import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

import {
  IonCard,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Router, RouterModule } from '@angular/router';
import { KycService } from '../../services/kyc.service';

import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';

import { Step1FormData, EmploymentStatus } from '../../models/step1.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  idCard, 
  checkmark, 
  arrowBack, 
  arrowForward,
  cameraOutline,
  cloudUploadOutline,
  trashOutline,
  person
} from 'ionicons/icons';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    IonCard,
    IonIcon,
    IonButton,

    MatProgressSpinnerModule,
    MatSnackBarModule,

    StepProgressComponent,
  ],
  templateUrl: './step2.component.html',
  styleUrls: [
    '../../shared/styles/kyc-form.scss',
    './step2.component.css'
  ]
})
export class Step2Component implements OnInit {
  idForm!: FormGroup;
  documentForm!: FormGroup;

  // Store base64 previews for uploaded files
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
  ) {
    // Register required icons
    addIcons({
      'id-card': idCard,
      'checkmark': checkmark,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward,
      'cloud-upload-outline': cloudUploadOutline,
      'trash-outline': trashOutline,
      'person': person,
      'camera-outline': cameraOutline
    });
  }

  ngOnInit() {
    // Initialize form groups with validators
    this.idForm = this.formBuilder.group({
      frontPhoto: [null, Validators.required],
      backPhoto: [null, Validators.required]
    });

    this.documentForm = this.formBuilder.group({
      selfie: [null, Validators.required]
    });

    this.loadSavedData();
  }

  // Handle file input for front/back ID upload
  onFileSelected(event: any, type: 'front' | 'back') {
    const file = event.target.files[0];
    if (file) {
      if (this.isValidImage(file)) {
        this.isLoading = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previews[type] = e.target.result;
          const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
          this.idForm.get(controlName)?.setValue(file);
          this.isLoading = false;
        };
        reader.onerror = () => {
          this.snackBar.open('Error loading image. Please try again.', 'Close', { duration: 3000 });
          this.isLoading = false;
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('Please upload a valid image file (JPG, PNG)', 'Close', { duration: 3000 });
        event.target.value = '';
      }
    }
  }

  // Remove uploaded front/back image and reset input
  removeImage(type: 'front' | 'back') {
    this.previews[type] = '';
    const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
    this.idForm.get(controlName)?.setValue(null);
    this.idForm.get(controlName)?.markAsDirty();

    const inputElement = type === 'front'
      ? (document.querySelector('#frontInput') as HTMLInputElement)
      : (document.querySelector('#backInput') as HTMLInputElement);
    if (inputElement) inputElement.value = '';
  }

  // Validate file type and size
  private isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      this.snackBar.open('File size exceeds 5MB limit.', 'Close', { duration: 3000 });
      return false;
    }
    return validTypes.includes(file.type);
  }

  // Handle selfie image upload
  onSelfieSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImage(file)) {
      this.previewSelfie(file);
      this.documentForm.get('selfie')?.setValue(file);
    } else {
      this.snackBar.open('Please upload a valid image file (JPG, PNG)', 'Close', { duration: 3000 });
      (event.target as HTMLInputElement).value = '';
    }
  }

  // Preview the uploaded selfie image
  private previewSelfie(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.selfiePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Remove selfie image and reset input
  removeSelfie() {
    this.selfiePreview = null;
    this.documentForm.get('selfie')?.setValue(null);
    this.documentForm.get('selfie')?.markAsDirty();

    const selfieInput = document.querySelector('#selfieInput') as HTMLInputElement;
    if (selfieInput) selfieInput.value = '';
  }

  // Navigate back to step 1
  onBack() {
    this.router.navigate(['/step1']);
  }

  // Handle form submission and document upload
  onNext() {
    this.markFormGroupTouched(this.idForm);
    this.markFormGroupTouched(this.documentForm);

    if (this.idForm.valid && this.documentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const customerId = localStorage.getItem('customerId');

      if (!customerId) {
        this.snackBar.open('Customer information missing. Please return to Step 1.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
        return;
      }

      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('frontPhotoId', this.idForm.get('frontPhoto')?.value);
      formData.append('backPhotoId', this.idForm.get('backPhoto')?.value);
      formData.append('selfieImage', this.documentForm.get('selfie')?.value);

      this.kycService.submitDocuments(formData).subscribe({
        next: (response) => {
          const step1Data = localStorage.getItem('step1Data');
          if (step1Data) {
            const parsedData = JSON.parse(step1Data);
            const updatedData = {
              ...parsedData,
              documentsSubmitted: true,
              selfieImageUrl: response.selfieImageUrl || parsedData.selfieImageUrl,
              frontPhotoIdUrl: response.frontPhotoIdUrl || parsedData.frontPhotoIdUrl,
              backPhotoIdUrl: response.backPhotoIdUrl || parsedData.backPhotoIdUrl,
            };
            localStorage.setItem('step1Data', JSON.stringify(updatedData));
          }

          this.snackBar.open('Documents uploaded successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/step3']);
        },
        error: (error) => {
          let errorMessage = 'Error uploading documents. Please try again.';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Bad request. Check file types and sizes.';
          } else if (error.status === 413) {
            errorMessage = 'File size too large.';
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
    } else {
      this.snackBar.open('Please upload all required documents', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  // Touch all controls to trigger validation messages
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Load preview data from localStorage
  private loadSavedData() {
    const savedData = localStorage.getItem('step2Data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.documentData) {
          this.selfiePreview = parsedData.documentData.selfiePreview || null;
          this.previews['front'] = parsedData.documentData.frontPhotoPreview || '';
          this.previews['back'] = parsedData.documentData.backPhotoPreview || '';

          this.documentForm.patchValue({ selfie: null });
          this.idForm.patchValue({ frontPhoto: null, backPhoto: null });
        }
      } catch (error) {
        console.error('Error parsing saved data for step 2:', error);
        localStorage.removeItem('step2Data');
      }
    }
  }

  // Handle user clicking stepper steps manually
  onStepClick(step: number) {
    if (step === 1) {
      this.router.navigate(['/step1']);
    } else if (step === 3) {
      if (this.idForm.valid && this.documentForm.valid) {
        this.saveStep2Draft();
        this.router.navigate(['/step3']);
      } else {
        this.snackBar.open('Please complete the current step before proceeding', 'Close', {
          duration: 3000
        });
        this.markFormGroupTouched(this.idForm);
        this.markFormGroupTouched(this.documentForm);
      }
    }
  }

  // Temporarily store image previews to restore later
  private saveStep2Draft() {
    const step2Draft = {
      documentData: {
        selfiePreview: this.selfiePreview,
        frontPhotoPreview: this.previews['front'],
        backPhotoPreview: this.previews['back'],
      }
    };
    localStorage.setItem('step2Data', JSON.stringify(step2Draft));
  }
}
