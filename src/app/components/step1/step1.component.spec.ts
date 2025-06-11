import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step1Component } from './step1.component';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing'; 

describe('Step1Component', () => {
  let component: Step1Component;
  let fixture: ComponentFixture<Step1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Step1Component,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgxIntlTelInputModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
       ... provideHttpClientTesting() // modern way to mock HttpClient
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Step1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
