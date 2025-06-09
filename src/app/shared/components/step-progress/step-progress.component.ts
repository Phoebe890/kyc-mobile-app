import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-step-progress',
  templateUrl: './step-progress.component.html',
  styleUrls: ['./step-progress.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class StepProgressComponent {
  @Input() currentStep: number = 1;

  steps: Step[] = [
    { number: 1, title: 'Personal Info', subtitle: 'Basic details' },
    { number: 2, title: 'ID Verification', subtitle: 'Document upload' },
    { number: 3, title: 'Contact Info', subtitle: 'Email verification' }
  ];

  isCompleted(stepNumber: number): boolean {
    return stepNumber < this.currentStep;
  }

  isActive(stepNumber: number): boolean {
    return stepNumber === this.currentStep;
  }

  getProgressPercentage(): number {
    return ((this.currentStep - 1) / (this.steps.length - 1)) * 100;
  }
} 