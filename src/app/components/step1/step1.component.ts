import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountyService } from '../../services/county.service';
import { KycService } from '../../services/kyc.service';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

// --- All necessary Ionic standalone components ---
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonDatetime,
  IonPopover,
} from '@ionic/angular/standalone';

// --- Icon registration ---
import { addIcons } from 'ionicons';
import { person, calendarOutline, arrowBack, arrowForward } from 'ionicons/icons';

// --- Third-party modules ---
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';

// --- Custom shared components ---
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';

export type EmploymentStatus = 'employed' | 'self-employed' | 'unemployed' | 'student' | 'retired';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    StepProgressComponent,
    NgxIntlTelInputModule,

    // All necessary Ionic components
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonDatetime,
    IonPopover,
  ],
  providers: [
    DatePipe
  ],
  templateUrl: './step1.component.html',
  styleUrls: [
    '../../shared/styles/kyc-form.scss', // Ensure this path is correct
    './step1.component.css'
  ]
})
export class Step1Component implements OnInit {
  personalInfoForm!: FormGroup;
  isLoadingCounties = false;
  isSubmitting = false;

  counties: string[] = [];
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.Kenya, CountryISO.Uganda, CountryISO.Tanzania, CountryISO.Ethiopia, CountryISO.Rwanda];

  maxDateString: string;

  employmentOptions: { value: EmploymentStatus; label: string }[] = [
    { value: 'employed', label: 'Employed' },
    { value: 'self-employed', label: 'Self Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'student', label: 'Student' },
    { value: 'retired', label: 'Retired' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private countyService: CountyService,
    private kycService: KycService,
    private snackBar: MatSnackBar
  ) {
    addIcons({
      person,
      'calendar-outline': calendarOutline,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward
    });
    const today = new Date();
    this.maxDateString = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s'-]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s'-]+$/)]],
      phoneNumber: [null, [Validators.required]],
      employmentStatus: [null as EmploymentStatus | null, [Validators.required]],
      dateOfBirth: [null, [Validators.required, this.ageValidator(18)]],
      county: ['', [Validators.required]]
    });
    this.loadCounties();
  }

  get firstName() { return this.personalInfoForm.get('firstName'); }
  get lastName() { return this.personalInfoForm.get('lastName'); }
  get phoneNumber() { return this.personalInfoForm.get('phoneNumber'); }
  get employmentStatus() { return this.personalInfoForm.get('employmentStatus'); }
  get dateOfBirth() { return this.personalInfoForm.get('dateOfBirth'); }
  get county() { return this.personalInfoForm.get('county'); }

  ageValidator(minAge: number) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= minAge ? null : { underage: true };
    };
  }

  loadCounties() {
    this.isLoadingCounties = true;
    this.countyService.getCounties().subscribe({
      next: (counties) => { this.counties = counties; this.isLoadingCounties = false; },
      error: (error) => { console.error('Error loading counties:', error); this.isLoadingCounties = false; }
    });
  }

  onNext() {
    if (this.personalInfoForm.invalid) {
      this.markFormGroupTouched(this.personalInfoForm);
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isSubmitting = true;
    const formData = this.personalInfoForm.getRawValue();
    const formattedDate = new Date(formData.dateOfBirth).toISOString().split('T')[0];

    // Ensure phoneNumber is a string (handle both ngx-intl-tel-input and plain string)
    let phoneNumber: string = '';
    if (typeof formData.phoneNumber === 'string') {
      phoneNumber = formData.phoneNumber;
    } else if (formData.phoneNumber && formData.phoneNumber.e164Number) {
      phoneNumber = formData.phoneNumber.e164Number;
    }

    // Construct payload with only the fields expected by the backend and omit nulls
    const payload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: phoneNumber,
      employmentStatus: formData.employmentStatus,
      dateOfBirth: formattedDate,
      county: formData.county,
      selfieImageUrl: "https://res.cloudinary.com/drkmm8xka/image/upload/v1747140876/file.jpg",
      isCaptured: false
    };
    // Only add optional fields if they have a real value
    if (formData.frontPhotoIdUrl) payload.frontPhotoIdUrl = formData.frontPhotoIdUrl;
    if (formData.backPhotoIdUrl) payload.backPhotoIdUrl = formData.backPhotoIdUrl;
    if (formData.email) payload.email = formData.email;

    // Log payload for debugging
    console.log('Submitting payload:', payload);

    this.kycService.submitPersonalDetails(payload).subscribe({
      next: (response) => {
        const storedData = {
          ...payload,
          customerId: response.id || response.customerId
        };
        localStorage.setItem('step1Data', JSON.stringify(storedData));
        localStorage.setItem('customerId', storedData.customerId?.toString());

        this.router.navigate(['/step2']);
        this.snackBar.open('Personal information saved successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = error.status === 409
          ? 'This phone number is already registered.'
          : 'Error submitting form. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }
}