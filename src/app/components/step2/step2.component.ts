import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Ionic and Angular Material Imports
// MODIFIED: Added ActionSheetController
import { IonCard, IonIcon, IonButton, ActionSheetController } from '@ionic/angular/standalone';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Capacitor Camera Plugin
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

// Local Imports
import { KycService } from '../../services/kyc.service';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { addIcons } from 'ionicons';
import { 
  idCard, checkmark, arrowBack, arrowForward, cameraOutline,
  cloudUploadOutline, trashOutline, person, closeOutline,
  imageOutline // MODIFIED: Added icon for gallery option
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
    private actionSheetCtrl: ActionSheetController // MODIFIED: Injected ActionSheetController
  ) {
    addIcons({
      'id-card': idCard,
      'checkmark': checkmark,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward,
      'cloud-upload-outline': cloudUploadOutline,
      'camera-outline': cameraOutline,
      'close-outline': closeOutline,
      'image-outline': imageOutline // MODIFIED: Registered icon for gallery option
    });
  }

  ngOnInit() {
    this.idForm = this.formBuilder.group({
      frontPhoto: [null, Validators.required],
      backPhoto: [null, Validators.required]
    });

    this.documentForm = this.formBuilder.group({
      selfie: [null, Validators.required]
    });
  }

  // *-- NEW: Method to present the action sheet for choosing image source --*
  async presentImageActionSheet(type: 'front' | 'back' | 'selfie') {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Choose Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          handler: () => {
            this.getImage(CameraSource.Camera, type);
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'image-outline',
          handler: () => {
            this.getImage(CameraSource.Photos, type);
          }
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

  // *-- MODIFIED: Renamed from selectImage and now accepts a source parameter --*
  async getImage(source: CameraSource, type: 'front' | 'back' | 'selfie') {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source // Use the provided source (Camera or Photos)
      });

      if (image.dataUrl) {
        const imageBlob = this.dataURLtoBlob(image.dataUrl);
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB

        if (imageBlob.size > maxSizeBytes) {
          this.snackBar.open('Image size exceeds 5MB limit.', 'Close', { duration: 3000 });
          return;
        }

        if (type === 'front' || type === 'back') {
          this.previews[type] = image.dataUrl;
          const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
          this.idForm.get(controlName)?.setValue(imageBlob);
        } else { // 'selfie'
          this.selfiePreview = image.dataUrl;
          this.documentForm.get('selfie')?.setValue(imageBlob);
        }
      }
    } catch (error) {
      console.log('User cancelled operation:', error);
      // No need for a snackbar here, as cancelling is a normal user action.
    }
  }
  
  // Helper function to convert Data URL to Blob (no changes needed)
  private dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error('Invalid data URL format');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Simplified remove methods (no changes needed)
  removeImage(type: 'front' | 'back') {
    this.previews[type] = null;
    const controlName = type === 'front' ? 'frontPhoto' : 'backPhoto';
    this.idForm.get(controlName)?.setValue(null);
  }

  removeSelfie() {
    this.selfiePreview = null;
    this.documentForm.get('selfie')?.setValue(null);
  }

  // Navigation and submission logic (no changes needed)
  onBack() {
    this.router.navigate(['/step1']);
  }

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
        next: (response) => {
          this.snackBar.open('Documents uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/step3']);
        },
        error: (error) => {
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}