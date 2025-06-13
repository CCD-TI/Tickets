import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiResponse, FileModel, Folder } from '../models/upload';

export interface UploadResponse {
  success: boolean;
  url: string;
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = `https://gestor.erpccd.com/api/gestor-archivos/gestor/uploadtickets`;
  private folderPath = 'Ticket-CCD';
  private http = inject(HttpClient);
  

  uploadImage(file: File): Observable<{files: {url: string}[]}> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('path', this.folderPath);
    formData.append('userId', '1');
    formData.append('newFolder', 'false');

    // const headers = new HttpHeaders({
    //   'Authorization': `Bearer ${environment.supabaseKey}`,
    //   'Accept': 'application/json',
    // });

    return this.http.post<{files: {url: string}[]}>(this.apiUrl, formData);
  }
}