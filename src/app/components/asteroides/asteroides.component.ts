import { Component, OnInit } from '@angular/core';
import { Asteroides } from 'src/app/models/asteroides.model';
import { AsteroidesNeoService } from 'src/app/services/asteroides-neo.service';
import { SnackbarService } from 'src/app/services/components/snackbar.service';

@Component({
  selector: 'app-asteroides',
  templateUrl: './asteroides.component.html',
  styleUrls: ['./asteroides.component.scss']
})
export class AsteroidesComponent implements OnInit {

  asteroidesObj: Asteroides = new Asteroides;
  asteroidesNear: any[] = [];
  startDateInfo: any;
  endDateInfo: any;
  DateInfo: any;
  startDateSelected: any;
  endDateSelected: any;
  isLoading: Boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  hasSearched: boolean = false;
  maxDate: Date = new Date();
  
  constructor(
    private asteroidesService: AsteroidesNeoService,
    private snackBarService: SnackbarService
  ) { }

  ngOnInit(): void {
    // Componente inicia sem buscar dados automaticamente
  }

  getAsteroidesByDate(startDate: Date, endDate: Date) {
    // Validações
    if (!startDate || !endDate) {
      this.showSnackbar('Por favor, selecione um intervalo de datas', 'Fechar');
      return;
    }

    const daysDiff = Math.abs((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      this.showSnackbar('O intervalo máximo é de 7 dias', 'Fechar');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      this.showSnackbar('A data inicial deve ser anterior à data final', 'Fechar');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.hasSearched = true;
    this.errorMessage = '';
    
    this.asteroidesService.getAsteroidesNeo(startDate, endDate).subscribe({
      next: (data) => {
        this.asteroidesObj = data;
        this.parseAsteroidesNear(this.asteroidesObj.near_earth_objects);
        this.isLoading = false;
        
        if (this.asteroidesNear.length === 0) {
          this.showSnackbar('Nenhum asteroide encontrado neste período', 'OK');
        } else {
          this.showSnackbar(`${this.asteroidesNear.length} asteroide(s) encontrado(s)!`, 'OK');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar asteroides', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados dos asteroides. Por favor, tente novamente.';
        this.showSnackbar('Erro ao carregar dados. Tente novamente.', 'Fechar');
      }
    });
  }

  parseAsteroidesNear(param: any) {
    this.asteroidesNear = Object.values(param).flat();
  }

  showSnackbar(message: string, action: string) {
    this.snackBarService.openSnackBar(message, action);
  }

  getDangerClass(isDangerous: boolean): string {
    return isDangerous ? 'dangerous' : 'safe';
  }

  getDangerLabel(isDangerous: boolean): string {
    return isDangerous ? 'Sim' : 'Não';
  }
}


