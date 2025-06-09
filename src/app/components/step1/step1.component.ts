import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountyService } from '../../services/county.service';
import { KycService } from '../../services/kyc.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';
import { StepProgressComponent } from '../../shared/components/step-progress/step-progress.component';
import { DateFilterFn } from '@angular/material/datepicker';
import { Step1FormData, EmploymentStatus } from '../../models/step1.interface';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [//import all necessary imports for this standalone component
    FormsModule,
    StepProgressComponent,
    ReactiveFormsModule,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    NgxIntlTelInputModule,
  ],
  templateUrl: './step1.component.html',//specifies the html file
  styleUrls: [
    '../../shared/styles/kyc-form.scss',
    './step1.component.css'
  ]
})
export class Step1Component implements OnInit {
  //reactive form group for personal info
  personalInfoForm: FormGroup;
  isLoadingCounties = false;
  isSubmitting = false;
  
personal_details = signal({
  firstName:"",
  lastName:"",
  phoneNumber:"",
  employmentStatus:"",
  county:"",
  dateOfBirth:"",
  selfieImageUrl:null,
  frontPhotoIdUrl:null,
  backPhotoIdUrl:null,
  email:null,
  isCaptured:false
})
//counties dropdown options
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

   // Signal to store phone data
  phoneSignal = signal<any>(null);

  onPhoneChange(phone: any) {
    this.phoneSignal.set(phone);
    console.log('Phone Signal:', this.phoneSignal());
    const fullPhoneNumber = this.phoneSignal()?.e164Number;
    this.personal_details.update(current => ({
      ...current,
      phoneNumber:fullPhoneNumber
    }));
  }
  
  maxDate: Date = new Date();
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
    private kycService: KycService,//inject the kyc service so you can call its methods
    private snackBar: MatSnackBar
  ) {

  //initialize reactive forms with validators
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
    this.loadCounties();//fetch county list
    //this.loadSavedData();
    this.setupFormValidation();
  }

  private setupFormValidation() {
    // set up real time validation for phone and date of birth
    this.personalInfoForm.get('phoneNumber')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'object' && 'valid' in value) {
        if (value.valid) {
          this.personalInfoForm.get('phoneNumber')?.setErrors(null);
        } else {
          this.personalInfoForm.get('phoneNumber')?.setErrors({ invalidNumber: true });
        }
      }
    });

    // Monitor date of birth changes for validation
    this.personalInfoForm.get('dateOfBirth')?.valueChanges.subscribe(value => {
      if (value) {
        const errors = this.dateOfBirthValidator()(new FormControl(value));
        this.personalInfoForm.get('dateOfBirth')?.setErrors(errors);
      }
    });
  }

  dateOfBirthValidator() {
    return (control: FormControl): { [key: string]: any } | null => {
      if (!control.value) return { required: true };
      
      const today = new Date();
      const birthDate = new Date(control.value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18 ? null : { underage: true };
    };
  }

  ageValidator: DateFilterFn<Date | null> = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18;
  };

 /* loadSavedData() {
    const savedData = localStorage.getItem('step1Data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const data = {
          ...parsedData,
          employmentStatus: parsedData.employmentStatus as EmploymentStatus,
          dateOfBirth: parsedData.dateOfBirth ? new Date(parsedData.dateOfBirth) : null
        };
        this.personalInfoForm.patchValue(data);
      } catch (error) {
        console.error('Error parsing saved data:', error);
        this.snackBar.open('Error loading saved data', 'Close', { duration: 3000 });
      }
    }
  }*/

    //fetch counties from the backend service
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
    if (this.personalInfoForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;//checks if the form has all required fields correct and a submission is not in progress
      const formData = this.personalInfoForm.getRawValue();
      
      // Format phone number - get the international format,returns an object
      const phoneNumber = formData.phoneNumber?.e164Number || formData.phoneNumber?.number;
      
      // Create the payload object  to send to the backend with all required fields
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: phoneNumber,
        employmentStatus: formData.employmentStatus,
        dateOfBirth: formData.dateOfBirth,
        county: formData.county,
        selfieImageUrl: null,
        frontPhotoIdUrl: null,
        backPhotoIdUrl: null,
        email: null,
        isCaptured: false
      };

      console.log('Form data before submission:', formData); // Debug log
      console.log('Payload being sent:', payload); // Debug log

      // The payload is passed th the submitPersonalDetails() method of the kyc service
      this.kycService.submitPersonalDetails(payload).subscribe({
        next: (response) => {
          console.log('Response from server:', response);
          // if server replies successfully it stores the customerid and saves it in local storage
          const storedData = {
            ...payload,
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
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
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
}

