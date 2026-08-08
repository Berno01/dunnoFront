import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  private validateConfig(): void {
    if (!this.cloudName || this.cloudName.trim() === '') {
      throw new Error('Configuración inválida de Cloudinary: cloudName está vacío.');
    }

    if (!this.uploadPreset || this.uploadPreset.trim() === '') {
      throw new Error('Configuración inválida de Cloudinary: upload_preset está vacío.');
    }
  }

  private buildErrorMessage(status: number, statusText: string, bodyText: string): string {
    if (bodyText) {
      try {
        const parsed = JSON.parse(bodyText);
        const cloudinaryMessage = parsed?.error?.message || parsed?.message;
        if (typeof cloudinaryMessage === 'string' && cloudinaryMessage.trim() !== '') {
          return cloudinaryMessage;
        }
      } catch {
        // Ignorar parseo fallido y usar fallback.
      }
    }

    const normalizedStatusText = statusText?.trim() || 'Unknown Error';
    return `Error al subir imagen (status: ${status} ${normalizedStatusText}).`;
  }

  private createFormData(file: File, folderName: string): FormData {
    this.validateConfig();

    const normalizedPreset = this.uploadPreset.trim();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', normalizedPreset);
    formData.append('folder', folderName);

    const formPreset = formData.get('upload_preset');
    if (!formPreset || String(formPreset).trim() === '') {
      throw new Error('No se puede subir: upload_preset está ausente en FormData.');
    }

    return formData;
  }

  private async performUpload(file: File, folderName: string): Promise<CloudinaryResponse> {
    const formData = this.createFormData(file, folderName);

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(this.buildErrorMessage(response.status, response.statusText, responseBody));
      }

      return response.json();
    } catch (error) {
      console.error('Error técnico en subida a Cloudinary:', {
        uploadUrl: this.uploadUrl,
        folderName,
        fileName: file?.name,
        error,
      });

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Error de red al subir imagen a Cloudinary.');
    }
  }

  /**
   * Sube una imagen a Cloudinary organizándola en carpetas por ID de categoría
   * @param file - Archivo de imagen a subir
   * @param folderName - ID de la categoría (se usará como nombre de carpeta)
   * @returns Observable con la URL segura de la imagen subida
   */
  uploadImage(file: File, folderName: string): Observable<string> {
    return from(this.performUpload(file, folderName)).pipe(
      map((data: CloudinaryResponse) => data.secure_url),
    );
  }

  /**
   * Sube múltiples imágenes a Cloudinary en la misma carpeta
   * @param files - Array de archivos a subir
   * @param folderName - ID de la categoría
   * @returns Observable con array de URLs
   */
  uploadMultipleImages(files: File[], folderName: string): Observable<string[]> {
    const uploadPromises = files.map((file) => this.performUpload(file, folderName));

    return from(Promise.all(uploadPromises)).pipe(
      map((responses: CloudinaryResponse[]) => responses.map((res) => res.secure_url)),
    );
  }
}
