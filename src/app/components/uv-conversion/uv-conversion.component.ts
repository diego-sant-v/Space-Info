import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { JwstService } from '../../services/jwst.service';

@Component({
  selector: 'app-uv-conversion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './uv-conversion.component.html',
  styleUrls: ['./uv-conversion.component.scss']
})
export class UvConversionComponent implements OnInit {
  images: any[] = [];
  isLoading = true;
  errorMessage = '';
  showSimplified = false;
  showTechnical = false;

  constructor(
    private jwstService: JwstService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadImages();
  }

  loadImages() {
    this.isLoading = true;
    this.errorMessage = '';

    this.jwstService.getImages(1, 12).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response); // Debug
        this.images = response.data || response.images || response || [];
        this.isLoading = false;

        if (this.images.length === 0) {
          this.errorMessage = 'Nenhuma imagem retornada pela API.';
        }
      },
      error: (error) => {
        console.error('Erro detalhado da API:', error);
        this.errorMessage = this.getUserFriendlyError(error);
        this.isLoading = false;
      }
    });
  }

  // Sanitiza URLs para evitar problemas de segurança
  sanitizeUrl(url: string): SafeUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustUrl('/assets/placeholder-space.jpg');
    }
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // Trata erro de carregamento de imagem
  handleImageError(image: any): void {
    console.warn(`Erro ao carregar imagem: ${image.title}`);
    image.url = '/assets/placeholder-space.jpg';
    // URL de fallback
    image.url = 'https://www.flickr.com/photos/nasawebbtelescope/55001995170/in/album-72177720323168468';
  }

  private getUserFriendlyError(error: any): string {
    if (error.status === 0) {
      return 'Não foi possível conectar à API. Verifique sua conexão com a internet.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Erro de autenticação. Verifique sua chave da API.';
    }
    if (error.status === 404) {
      return 'Endpoint da API não encontrado. Verifique a URL.';
    }
    if (error.status === 429) {
      return 'Muitas requisições. Aguarde alguns instantes e tente novamente.';
    }
    if (error.status === 500 || error.status === 502 || error.status === 503) {
      return 'O servidor da API está temporariamente indisponível. Tente novamente mais tarde.';
    }
    return 'Erro ao carregar imagens. Tente novamente mais tarde.';
  }
}
