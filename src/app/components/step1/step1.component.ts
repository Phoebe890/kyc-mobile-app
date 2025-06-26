import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule ,AbstractControl} from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountyService } from '../../services/county.service';
import { KycService } from '../../services/kyc.service';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import {
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

// --- 1. IMPORT addIcons AND THE SPECIFIC ICONS YOU NEED ---
import { addIcons } from 'ionicons';
import { person, calendarOutline, arrowBack, arrowForward } from 'ionicons/icons';

import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';

import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
export type EmploymentStatus = 'employed' | 'self-employed' | 'unemployed' | 'student' | 'retired';


@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [
    FormsModule,
    StepProgressComponent,
    ReactiveFormsModule,
    CommonModule,
    DatePipe,
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
    NgxIntlTelInputModule,
  ],
  templateUrl: './step1.component.html',
  styleUrls: [
    '../../shared/styles/kyc-form.scss',
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
  public dropdownContainer = 'body'; 

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
    // --- 2. REGISTER THE ICONS IN THE CONSTRUCTOR ---
    addIcons({
      person,
      'calendar-outline': calendarOutline,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward
    });

    // Set the max date string robustly
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    this.maxDateString = `${year}-${month}-${day}`;
  }

  // ... (the rest of your component logic is correct and does not need to be changed)
  get firstName() { return this.personalInfoForm.get('firstName'); }
  get lastName() { return this.personalInfoForm.get('lastName'); }
  get phoneNumber() { return this.personalInfoForm.get('phoneNumber'); }
  get employmentStatus() { return this.personalInfoForm.get('employmentStatus'); }
  get dateOfBirth() { return this.personalInfoForm.get('dateOfBirth'); }
  get county() { return this.personalInfoForm.get('county'); }

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
  // Ensure dateOfBirth is always a string (never null)
  const formattedDate = new Date(formData.dateOfBirth).toISOString().split('T')[0];

  const payload = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phoneNumber: formData.phoneNumber.e164Number,
    employmentStatus: formData.employmentStatus,
    dateOfBirth: formattedDate,
    county: formData.county,
    selfieImageUrl: null,
    frontPhotoIdUrl: null,
    backPhotoIdUrl: null,
    email: null,
    isCaptured: false
  };

  this.kycService.submitPersonalDetails(payload).subscribe({
      next: (response) => {
        this.router.navigate(['/step2']);
        this.snackBar.open('Personal information saved successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = error.status === 409 ? 'This phone number is already registered.' : 'Error submitting form. Please try again.';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
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