import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

interface CustomerResponse {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employmentStatus: string;
  dateOfBirth: string;
  county: string;
}

interface DocumentResponse {
  frontPhotoIdUrl: string;
  backPhotoIdUrl: string;
  selfieImageUrl: string;
}

@Injectable({
  providedIn: 'root'//makes the service available in the app
})
export class KycService {
  private apiUrl = 'http://localhost:8081';//base url for the backend
  private route = inject(Router);

  constructor(private http: HttpClient) {}
//get kyc status to show if verification is complete or pending
  getKycStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }

  /**
   * Accepts customer details and submits them to the backend
   */
  submitPersonalDetails(customerData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    employmentStatus: string;
    dateOfBirth: Date | string;
    county: string;
    selfieImageUrl: string | null;
    frontPhotoIdUrl: string | null;
    backPhotoIdUrl: string | null;
    email: string | null;
    isCaptured: boolean;
  }): Observable<CustomerResponse> {
    // Format the date if it's a Date object
    const formattedDate = customerData.dateOfBirth instanceof Date 
      ? customerData.dateOfBirth.toISOString().split('T')[0]
      : customerData.dateOfBirth;
//construct the payload to send to the backend
    const payload = {
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phoneNumber: customerData.phoneNumber,
      employmentStatus: customerData.employmentStatus,
      dateOfBirth: formattedDate,
      county: customerData.county,
      selfieImageUrl: customerData.selfieImageUrl,
      frontPhotoIdUrl: customerData.frontPhotoIdUrl,
      backPhotoIdUrl: customerData.backPhotoIdUrl,
      email: customerData.email,
      isCaptured: customerData.isCaptured
    };

    console.log('Sending payload to backend:', payload); // Debug log
//send POST request to create a new customer
    return this.http.post<CustomerResponse>(`${this.apiUrl}/new-customer`, payload).pipe(
      tap(response => {
        //on success ,store returned customerid and formdata in local storage
        const storedData = {
          ...payload,
          customerId: response.id || response.customerId
        };
        localStorage.setItem('step1Data', JSON.stringify(storedData));
        localStorage.setItem('customerId', storedData.customerId.toString());
        console.log('Customer created successfully:', response);
      }),
      catchError(error => {
        console.error('Failed to submit personal details:', error);
        throw error;
      })
    );
  }

  submitDocuments(formData: FormData): Observable<DocumentResponse> {
    //retrieve data stored from step1
    const step1Data = localStorage.getItem('step1Data');
    if (!step1Data) throw new Error('Customer information not found. Complete step 1 first.');

    const { customerId } = JSON.parse(step1Data);
    if (!customerId) throw new Error('Customer ID not found.');

    console.log('Submitting documents for customerId:', customerId);
    
    // Log FormData contents safely
    const formDataEntries = Array.from(formData.entries());
    console.log('FormData contents:', formDataEntries.map(([key, value]) => ({
      key,
      value: value instanceof File ? value.name : value
    })));

    // Add customerId to the FormData
    formData.append('customerId', customerId.toString());
//send PUT request to upload documents
    return this.http.put<DocumentResponse>(`${this.apiUrl}/upload-documents/${customerId}`, formData, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => {
        console.log('Documents Response:', response);
        // Update the stored data to include document URLs
        const updatedData = {
          ...JSON.parse(step1Data),
          frontPhotoIdUrl: response.frontPhotoIdUrl,
          backPhotoIdUrl: response.backPhotoIdUrl,
          selfieImageUrl: response.selfieImageUrl,
          documentsSubmitted: true
        };
        localStorage.setItem('step1Data', JSON.stringify(updatedData));
      }),
      catchError(error => {
        console.error('Documents API Error:', error);
        throw error;
      })
    );
  }

  submitEmail(email: string): Observable<any> {
    //load step1 data from local storage
    const step1Data = localStorage.getItem('step1Data');
    if (!step1Data) throw new Error('Customer information not found. Complete step 1 first.');

    const { customerId } = JSON.parse(step1Data);
    if (!customerId) throw new Error('Customer ID not found.');
//build URL parameters
    const params = new URLSearchParams();
    params.append('email', email);
//send PUT request to upload email
    return this.http.put(`${this.apiUrl}/upload-email/${customerId}?${params.toString()}`, null, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => console.log('Email Response:', response)),
      catchError(error => {
        console.error('Email API Error:', error);
        throw error;
      })
    );
  }

  /**
   * Converts JS Date to 'YYYY-MM-DD'
   */
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * the method converts a javascript object into a formdata object which sends formdata to the backend
   */
  prepareFormData(data: Record<string, any>): FormData {
    const formData = new FormData();//creates an empty formdata object
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value, value.name);
      } else {
        formData.append(key, value);
      }
    });
    return formData;//returns the populated formdata object ready to be sent to the backend
  }
}
