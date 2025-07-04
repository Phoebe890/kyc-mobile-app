import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { IonCard, IonIcon, IonButton, ActionSheetController } from '@ionic/angular/standalone';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { NgZone } from '@angular/core';

import { KycService } from '../../services/kyc.service';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { addIcons } from 'ionicons';
import { 
  idCard, checkmark, arrowBack, arrowForward, cameraOutline,
  cloudUploadOutline, trashOutline, person, closeOutline,
  imageOutline
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

  previews: { [key: string]: string | null } = {
    front: null,
    back: null
  };
  selfiePreview: string | null = null;
  currentStep: number = 2;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private kycService: KycService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private actionSheetCtrl: ActionSheetController,
  ) {
    // Register Ionicons used in this component
    addIcons({
      'id-card': idCard,
      'checkmark': checkmark,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward,
      'cloud-upload-outline': cloudUploadOutline,
      'camera-outline': cameraOutline,
      'close-outline': closeOutline,
      'image-outline': imageOutline
    });
  }

  ngOnInit() {
    // Initialize form groups with required validators
    this.idForm = this.formBuilder.group({
      frontPhoto: [null, Validators.required],
      backPhoto: [null, Validators.required]
    });

    this.documentForm = this.formBuilder.group({
      selfie: [null, Validators.required]
    });
  }

  /**
   * Opens an action sheet allowing the user to choose between
   * taking a photo or selecting from the gallery.
   */
  async presentImageActionSheet(type: 'front' | 'back' | 'selfie') {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Choose Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          handler: () => this.getImage(CameraSource.Camera, type)
        },
        {
          text: 'Choose from Gallery',
          icon: 'image-outline',
          handler: () => this.getImage(CameraSource.Photos, type)
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Handles image capture or selection and assigns the result
   * to the appropriate form control and preview.
   */
  async getImage(source: CameraSource, type: 'front' | 'back' | 'selfie') {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source
      });

      if (image.dataUrl) {
        const imageBlob = this.dataURLtoBlob(image.dataUrl);
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB max size

        if (imageBlob.size > maxSizeBytes) {
          this.snackBar.open('Image size exceeds 5MB limit.', 'Close', { duration: 3000 });
          return;
        }

        // Trigger Angular change detection manually
        this.zone.run(() => {
          if (type === 'front' || type === 'back') {
            this.previews[type] = image.dataUrl!;
            const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
            this.idForm.get(controlName)?.setValue(imageBlob);
          } else {
            this.selfiePreview = image.dataUrl!;
            this.documentForm.get('selfie')?.setValue(imageBlob);
          }
        });
      }
    } catch (error) {
      console.log('User cancelled operation:', error);
      // Cancellation is a normal action; no error display needed.
    }
  }

  /**
   * Converts a base64 data URL to a Blob for uploading.
   */
  private dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL format');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Removes a selected ID image and clears its form control.
   */
  removeImage(type: 'front' | 'back') {
    this.previews[type] = null;
    const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
    this.idForm.get(controlName)?.setValue(null);
  }

  /**
   * Removes the selected selfie and clears its form control.
   */
  removeSelfie() {
    this.selfiePreview = null;
    this.documentForm.get('selfie')?.setValue(null);
  }

  /**
   * Navigate to the previous KYC step.
   */
  onBack() {
    this.router.navigate(['/step1']);
  }

  /**
   * Submits the form if all required fields are valid.
   * Shows success/failure messages accordingly.
   */
  onNext() {
    if (this.idForm.invalid || this.documentForm.invalid) {
      this.snackBar.open('Please upload all required documents.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      this.markFormGroupTouched(this.idForm);
      this.markFormGroupTouched(this.documentForm);
      return;
    }

    if (!this.isSubmitting) {
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
      formData.append('frontPhotoId', this.idForm.get('frontPhoto')?.value, 'front-id.jpg');
      formData.append('backPhotoId', this.idForm.get('backPhoto')?.value, 'back-id.jpg');
      formData.append('selfieImage', this.documentForm.get('selfie')?.value, 'selfie.jpg');

      this.kycService.submitDocuments(formData).subscribe({
        next: () => {
          this.snackBar.open('Documents uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/step3']);
        },
        error: () => {
          this.snackBar.open('Error uploading documents. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Marks all controls in the form group as touched to show validation errors.
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
