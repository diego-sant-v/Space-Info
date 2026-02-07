import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ImageOfDayService } from 'src/app/services/imageOfDay/image-of-day.service';
import { SnackbarService } from 'src/app/services/components/snackbar.service';
import { TranslateService } from 'src/app/services/translate/translate.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  startDateInfo: any;
  endDateInfo: any;
  DateInfo: any;
  dateSelected: any;
  isLoading: Boolean = false;
  infoImage: any[] = [];
  hasError: boolean = false;
  errorMessage: string = '';
  maxDate: Date = new Date();
  minDate: Date = new Date('1995-06-16'); // Data de início da APOD

  constructor(
    private imageOfDayService: ImageOfDayService, 
    private datePipe: DatePipe,
    private snackBarService: SnackbarService,
    private translateService: TranslateService
  ) { }

  getImageOfDayByDate(dateSelected: any) {
    if (!dateSelected) {
      this.showSnackbar('Por favor, selecione uma data', 'Fechar');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.imageOfDayService.getImageOfDay(dateSelected).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.infoImage = data;
        } else {
          this.infoImage = [data];
        }
        
        // Traduz título e explicação de cada imagem
        this.infoImage.forEach(image => {
          if (image.title) {
            this.translateService.translate(image.title).subscribe(translated => {
              image.title_pt = translated;
            });
          }
          if (image.explanation) {
            this.translateService.translate(image.explanation).subscribe(translated => {
              image.explanation_pt = translated;
            });
          }
        });
        
        this.isLoading = false;
        
        if (this.infoImage.length === 0) {
          this.hasError = true;
          this.errorMessage = 'Nenhuma imagem encontrada para esta data';
        }
      },
      error: (error) => {
        console.error('Erro ao carregar imagem', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar a imagem do dia. Por favor, tente novamente.';
        this.showSnackbar('Erro ao carregar dados. Tente novamente.', 'Fechar');
      }
    });
  }

  showSnackbar(message: string, action: string) {
    this.snackBarService.openSnackBar(message, action);
  }

  ngOnInit() {
    this.dateSelected = new Date();
    this.getImageOfDayByDate(this.dateSelected);
  }
}
