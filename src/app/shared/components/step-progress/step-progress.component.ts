import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
//define what each step looks like
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
  //input propert to track which step is currently active
  @Input() currentStep: number = 1;
//defines the three steps that will be shown
  steps: Step[] = [
    { number: 1, title: 'Personal Info', subtitle: 'Basic details' },
    { number: 2, title: 'ID Verification', subtitle: 'Document upload' },
    { number: 3, title: 'Contact Info', subtitle: 'Email verification' }
  ];
//return true if a step has been completed
  isCompleted(stepNumber: number): boolean {
    return stepNumber < this.currentStep;
  }
//return true if a step is currently active
  isActive(stepNumber: number): boolean {
    return stepNumber === this.currentStep;
  }

  getProgressPercentage(): number {
    return ((this.currentStep - 1) / (this.steps.length - 1)) * 100;
  }
} 