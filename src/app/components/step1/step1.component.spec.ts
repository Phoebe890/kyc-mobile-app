import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1Component } from './step1.component';
import { ReactiveFormsModule, FormGroup } from '@angular/forms'; // Import ReactiveFormsModule and FormGroup
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { MatDatepickerModule } from '@angular/material/datepicker'; // Import MatDatepickerModule
import { MatNativeDateModule } from '@angular/material/core'; // Import MatNativeDateModule
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input'; // Import NgxIntlTelInputModule
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // Add NoopAnimationsModule for Material components

describe('Step1Component', () => {
  let component: Step1Component;
  let fixture: ComponentFixture<Step1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Step1Component, // Imports its own dependencies (standalone component)
        ReactiveFormsModule, // Necessary for testing FormGroup
        MatCardModule,       // Necessary for <mat-card>
        MatFormFieldModule,  // Necessary for <mat-form-field>
        MatInputModule,      // Necessary for <input matInput>
        MatDatepickerModule, // Necessary for <mat-datepicker>
        MatNativeDateModule, // Necessary for datepicker core
        NgxIntlTelInputModule, // Necessary for ngx-intl-tel-input
        MatButtonModule,     // Necessary for <button mat-button>
        NoopAnimationsModule // Prevents animation issues in tests
      ]
      // schemas: [CUSTOM_ELEMENTS_SCHEMA] // Remove if removed from component
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step1Component);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit, which initializes the form
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the personalInfoForm', () => {
    expect(component.personalInfoForm).toBeDefined();
    expect(component.personalInfoForm instanceof FormGroup).toBeTrue();
    expect(Object.keys(component.personalInfoForm.controls).length).toBe(6);
  });

  
});