import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Step2Guard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const step1Data = localStorage.getItem('step1Data');
    if (!step1Data) {
      this.router.navigate(['/step1']);
      return false;
    }
    return true;
  }
}