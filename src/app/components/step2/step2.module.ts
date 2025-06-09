import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Step2Component } from './step2.component';

@NgModule({
 // declarations: [Step2Component],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    SharedModule
  ],
 // exports: [Step2Component]
})
export class Step2Module { } 