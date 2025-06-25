import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountyService } from '../../services/county.service';
import { KycService } from '../../services/kyc.service';
import { CommonModule } from '@angular/common';

import {
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
} from '@ionic/angular/standalone';

import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';

import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';

import { Step1FormData, EmploymentStatus } from '../../models/step1.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [
    FormsModule,
    StepProgressComponent,
    ReactiveFormsModule,
    CommonModule,

    IonCard,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,

    NgxIntlTelInputModule,
  ],
  templateUrl: './step1.component.html',
  styleUrls: [
    '../../shared/styles/kyc-form.scss',
    './step1.component.css'
  ]
})
export class Step1Component implements OnInit {
  personalInfoForm: FormGroup;
  isLoadingCounties = false;
  isSubmitting = false;

  personal_details = signal({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    employmentStatus: "",
    county: "",
    dateOfBirth: "",
    selfieImageUrl: null,
    frontPhotoIdUrl: null,
    backPhotoIdUrl: null,
    email: null,
    isCaptured: false
  });

  counties: string[] = [];
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.Kenya,
    CountryISO.Uganda,
    CountryISO.Tanzania,
    CountryISO.Ethiopia,
    CountryISO.Rwanda
  ];
  searchCountryField: SearchCountryField[] = [
    SearchCountryField.Iso2,
    SearchCountryField.Name,
    SearchCountryField.DialCode
  ];

  phoneSignal = signal<any>(null);

  onPhoneChange(phone: any) {
    this.phoneSignal.set(phone);
    const fullPhoneNumber = this.phoneSignal()?.e164Number;
    this.personal_details.update(current => ({
      ...current,
      phoneNumber: fullPhoneNumber
    }));
  }

  maxDate: Date = new Date();
  maxDateString: string = this.maxDate.toISOString().split('T')[0];

  startDate: Date = new Date(1990, 0, 1);

  employmentOptions: { value: EmploymentStatus; label: string }[] = [
    { value: 'employed', label: 'Employed' },
    { value: 'self-employed', label: 'Self Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'student', label: 'Student' },
    { value: 'retired', label: 'Retired' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private countyService: CountyService,
    private kycService: KycService,
    private snackBar: MatSnackBar
  ) {
    this.personalInfoForm = this.formBuilder.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      phoneNumber: [null, [Validators.required]],
      employmentStatus: [null as EmploymentStatus | null, [Validators.required]],
      dateOfBirth: [null, [Validators.required, this.dateOfBirthValidator()]],
      county: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadCounties();
    this.setupFormValidation();
  }

  private setupFormValidation() {
    this.personalInfoForm.get('phoneNumber')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'object' && 'valid' in value) {
        if (value.valid) {
          this.personalInfoForm.get('phoneNumber')?.setErrors(null);
        } else {
          this.personalInfoForm.get('phoneNumber')?.setErrors({ invalidNumber: true });
        }
      } else if (value === null || value === undefined || value === '') {
           if (!this.personalInfoForm.get('phoneNumber')?.hasError('required')) {
               this.personalInfoForm.get('phoneNumber')?.setErrors({ required: true });
           }
      }
    });

    this.personalInfoForm.get('dateOfBirth')?.valueChanges.subscribe(value => {
      if (value) {
        const dateValue = (typeof value === 'string') ? new Date(value) : value;
        const errors = this.dateOfBirthValidator()(new FormControl(dateValue));
        this.personalInfoForm.get('dateOfBirth')?.setErrors(errors);
      } else {
         if (!this.personalInfoForm.get('dateOfBirth')?.hasError('required')) {
            this.personalInfoForm.get('dateOfBirth')?.setErrors({ required: true });
         }
      }
    });
  }

  dateOfBirthValidator() {
    return (control: FormControl): { [key: string]: any } | null => {
      if (!control.value) return { required: true };

      const birthDate = (typeof control.value === 'string') ? new Date(control.value) : control.value;

      if (isNaN(birthDate.getTime())) {
          return { invalidDate: true };
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18 ? null : { underage: true };
    };
  }

  loadCounties() {
    this.isLoadingCounties = true;
    this.countyService.getCounties().subscribe({
      next: (counties) => {
        this.counties = counties;
        this.isLoadingCounties = false;
      },
      error: (error) => {
        console.error('Error loading counties:', error);
        this.isLoadingCounties = false;
        this.snackBar.open('Error loading counties. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onNext() {
    const phoneNumberControl = this.personalInfoForm.get('phoneNumber');
    const isPhoneValid = phoneNumberControl?.value?.valid === true;

    if (this.personalInfoForm.valid && isPhoneValid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.personalInfoForm.getRawValue();

      const phoneNumber = formData.phoneNumber?.e164Number || formData.phoneNumber?.number;
      const dateOfBirth = formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : null;

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: phoneNumber,
        employmentStatus: formData.employmentStatus,
        dateOfBirth: dateOfBirth || new Date().toISOString().split('T')[0], // Provide a default date if null
        county: formData.county,
        selfieImageUrl: null,
        frontPhotoIdUrl: null,
        backPhotoIdUrl: null,
        email: null,
        isCaptured: false
      };

      this.kycService.submitPersonalDetails(payload).subscribe({
        next: (response) => {
          console.log('Response from server:', response);
          const storedData = {
            ...payload,
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
            customerId: response.id || response.customerId
          };
          localStorage.setItem('step1Data', JSON.stringify(storedData));
          localStorage.setItem('customerId', storedData.customerId.toString());

          this.router.navigate(['/step2']);
          this.snackBar.open('Personal information saved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error submitting form:', error);
          this.isSubmitting = false;
          if (error.status === 409) {
            this.snackBar.open('This phone number is already registered. Please use a different number or contact support if you need help with your existing registration.', 'Close', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open('Error submitting form. Please try again.', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.personalInfoForm);
       const message = isPhoneValid ?
                       'Please fill in all required fields correctly' :
                       'Please fix the errors, including the phone number';

      this.snackBar.open(message, 'Close', {
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
     const phoneControl = formGroup.get('phoneNumber');
     if (phoneControl) {
         phoneControl.markAsTouched();
     }
  }
}