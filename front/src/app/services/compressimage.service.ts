// src/app/services/compress-image.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CompressImageService {
  async compressImage(canvas: HTMLCanvasElement, quality: number = 0.8): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  }
}
