import { Component, OnInit } from '@angular/core';
import { TypePhotos } from 'src/app/models/rover/type-photos.model';
import { SnackbarService } from 'src/app/services/components/snackbar.service';
import { RoverMarsService } from 'src/app/services/rover/rover-mars.service';

@Component({
  selector: 'app-mars-rover',
  templateUrl: './mars-rover.component.html',
  styleUrls: ['./mars-rover.component.scss']
})
export class MarsRoverComponent implements OnInit {
  roverPhotosInfo: any;
  typeCamera: TypePhotos[] = Object.values(TypePhotos);
  typeCameraSelected: any;
  dateSelected: any;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  hasSearched: boolean = false;
  maxDate: Date = new Date();
  minDate: Date = new Date('2012-08-06'); // Data de pouso do Curiosity
  
  constructor(
    private roverPhotos: RoverMarsService, 
    private snackBarService: SnackbarService
  ) { }

  ngOnInit(): void {
    // Define uma câmera padrão
    this.typeCameraSelected = this.typeCamera[0];
  }

  getRoverPhotos(dateSelected: any) {
    // Validações
    if (!dateSelected) {
      this.showSnackbarAlert('Por favor, selecione uma data', 'Fechar');
      return;
    }

    if (!this.typeCameraSelected) {
      this.showSnackbarAlert('Por favor, selecione uma câmera', 'Fechar');
      return;
    }

    const selectedDate = new Date(dateSelected);
    if (selectedDate < this.minDate) {
      this.showSnackbarAlert('O Curiosity pousou em Marte em 06/08/2012. Selecione uma data posterior.', 'Fechar');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.hasSearched = true;
    this.errorMessage = '';
    
    this.roverPhotos.getRoverMarsPhotos(this.typeCameraSelected, dateSelected).subscribe({
      next: (data) => {
        this.roverPhotosInfo = data;
        this.isLoading = false;
        
        if (data.photos.length === 0) {
          this.showSnackbarAlert('Nenhuma foto encontrada para esta data e câmera. Tente outra combinação.', 'OK');
        } else {
          this.showSnackbarAlert(`${data.photos.length} foto(s) encontrada(s)!`, 'OK');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar fotos', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar fotos do Curiosity. Por favor, tente novamente.';
        this.showSnackbarAlert('Erro ao carregar dados. Tente novamente.', 'Fechar');
      }
    });
  }

  showSnackbarAlert(message: string, action: string) {
    this.snackBarService.openSnackBar(message, action);
  }

  getCameraLabel(camera: TypePhotos): string {
    const labels: { [key in TypePhotos]: string } = {
      [TypePhotos.FHAZ]: '🔻 FHAZ - Câmera Frontal',
      [TypePhotos.RHAZ]: '🔻 RHAZ - Câmera Traseira',
      [TypePhotos.CHEMCAM]: '🔬 CHEMCAM - Câmera Química',
      [TypePhotos.MAHLI]: '📸 MAHLI - Lente de Mão',
      [TypePhotos.MARDI]: '🛩️ MARDI - Descida',
      [TypePhotos.NAVCAM]: '🧭 NAVCAM - Navegação',
      [TypePhotos.PANCAM]: '📷 PANCAM - Câmera Panorâmica',
      [TypePhotos.MINITES]: '🔍 MINITES - Mini-TES'
    };
    return labels[camera] || camera;
  }
}
