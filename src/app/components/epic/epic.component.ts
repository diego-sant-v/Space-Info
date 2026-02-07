import { Component, OnInit } from '@angular/core';
import { EpicService } from '../../services/epic/epic.service';
import { SnackbarService } from '../../services/components/snackbar.service';
import { TranslateService } from 'src/app/services/translate/translate.service';

@Component({
  selector: 'app-epic',
  templateUrl: './epic.component.html',
  styleUrls: ['./epic.component.scss']
})
export class EpicComponent implements OnInit {
  epicImages: any[] = [];
  selectedDate: Date | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  hasSearched: boolean = false;
  maxDate: Date = new Date();
  minDate: Date = new Date('2015-10-01'); // Data inicial de disponibilidade do EPIC

  constructor(
    private epicService: EpicService,
    private snackBarService: SnackbarService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    // Carrega imagens do dia atual ao iniciar
    this.getLatestImages();
  }

  getLatestImages() {
    this.isLoading = true;
    this.hasError = false;
    this.hasSearched = true;
    this.errorMessage = '';

    this.epicService.getLatestEpicImages().subscribe({
      next: (data) => {
        this.epicImages = data;
        
        // Traduz captions
        this.epicImages.forEach(image => {
          if (image.caption) {
            this.translateService.translate(image.caption).subscribe(translated => {
              image.caption_pt = translated;
            });
          }
        });
        
        this.isLoading = false;

        if (this.epicImages.length === 0) {
          this.showSnackbar('Nenhumsa imagem disponível para esta data', 'OK');
        } else {
          this.showSnackbar(`${this.epicImages.length} imagem(ns) encontrada(s)!`, 'OK');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar imagens EPIC', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar imagens da Terra. Por favor, tente novamente.';
        this.showSnackbar('Erro ao carregar dados. Tente novamente.', 'Fechar');
      }
    });
  }

  getImagesByDate(date: Date) {
    if (!date) {
      this.showSnackbar('Por favor, selecione uma data', 'Fechar');
      return;
    }

    const selectedDate = new Date(date);
    if (selectedDate < this.minDate) {
      this.showSnackbar('As imagens EPIC estão disponíveis desde 01/10/2015', 'Fechar');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.hasSearched = true;
    this.errorMessage = '';

    this.epicService.getEpicImagesByDate(date).subscribe({
      next: (data) => {
        this.epicImages = data;
        
        // Traduz captions
        this.epicImages.forEach(image => {
          if (image.caption) {
            this.translateService.translate(image.caption).subscribe(translated => {
              image.caption_pt = translated;
            });
          }
        });
        
        this.isLoading = false;

        if (this.epicImages.length === 0) {
          this.showSnackbar('Nenhuma imagem disponível para esta data', 'OK');
        } else {
          this.showSnackbar(`${this.epicImages.length} imagem(ns) encontrada(s)!`, 'OK');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar imagens EPIC', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar imagens da Terra. Por favor, tente novamente.';
        this.showSnackbar('Erro ao carregar dados. Tente novamente.', 'Fechar');
      }
    });
  }

  getImageUrl(image: any): string {
    return this.epicService.buildImageUrl(image);
  }

  showSnackbar(message: string, action: string) {
    this.snackBarService.openSnackBar(message, action);
  }

  formatCoordinates(lat: number, lon: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'L' : 'O';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
  }
}
