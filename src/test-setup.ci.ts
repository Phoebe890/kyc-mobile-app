import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideAnimations()],
});
