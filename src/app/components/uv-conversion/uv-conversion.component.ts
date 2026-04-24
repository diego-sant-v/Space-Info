import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  // Configuração da nova API JWST
  private API_KEY = "a9b30911-8d40-430d-b5a2-6c805ed91411";
  private BASE_URL = 'https://api.jwstapi.com/all/type/jpg?page=1&perPage=12';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadImages();
  }

  async loadImages() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Resposta da API JWST:', data); // Debug

      // Verifica se a resposta tem o formato esperado
      if (data && data.body && Array.isArray(data.body)) {
        this.images = data.body;
      } else if (data && Array.isArray(data)) {
        this.images = data;
      } else {
        console.warn('Formato de resposta inesperado:', data);
        this.images = [];
        this.errorMessage = 'Formato de dados inesperado da API.';
      }

      this.isLoading = false;

      if (this.images.length === 0) {
        this.errorMessage = 'Nenhuma imagem retornada pela API.';
      }

    } catch (error: any) {
      console.error('Erro detalhado da API JWST:', error);
      this.errorMessage = this.getUserFriendlyError(error);
      this.isLoading = false;
    }
  }

  // Sanitiza URLs para evitar problemas de segurança
  sanitizeUrl(url: string): SafeUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustUrl('https://via.placeholder.com/800x600?text=Imagem+JWST+Indisponível');
    }
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // Trata erro de carregamento de imagem
  handleImageError(image: any): void {
    console.warn(`Erro ao carregar imagem: ${image.program || 'ID: ' + image.id}`);
    image.location = 'https://via.placeholder.com/800x600?text=Imagem+Não+Disponível';
  }

  private getUserFriendlyError(error: any): string {
    if (error.message && error.message.includes('fetch')) {
      return 'Não foi possível conectar à API. Verifique sua conexão com a internet ou se a API está no ar.';
    }
    if (error.message && error.message.includes('401') || error.message.includes('403')) {
      return 'Erro de autenticação. Verifique sua chave da API.';
    }
    if (error.message && error.message.includes('404')) {
      return 'Endpoint da API não encontrado. Verifique a URL.';
    }
    if (error.message && error.message.includes('429')) {
      return 'Muitas requisições. Aguarde alguns instantes e tente novamente.';
    }
    if (error.message && (error.message.includes('500') || error.message.includes('502') || error.message.includes('503'))) {
      return 'O servidor da API está temporariamente indisponível. Tente novamente mais tarde.';
    }
    return `Erro ao carregar imagens: ${error.message || 'Tente novamente mais tarde.'}`;
  }
}
