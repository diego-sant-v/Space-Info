import { Component } from '@angular/core';
import { TypePhotos } from 'src/app/models/rover/type-photos.model';
import { SnackbarService } from 'src/app/services/components/snackbar.service';
import { RoverMarsService } from 'src/app/services/rover/rover-mars.service';

@Component({
  selector: 'app-mars-rover',
  templateUrl: './mars-rover.component.html',
  styleUrls: ['./mars-rover.component.scss']
})
export class MarsRoverComponent {
  roverPhotosInfo: any;
  typeCamera: TypePhotos[] = Object.values(TypePhotos);
  typeCameraSelected: any;
  dateSelected: any;
  isLoading:any;
  constructor(private roverPhotos: RoverMarsService, private snackBarService: SnackbarService) {

  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

  }
  getRoverPhotos(dateSelected: any) {
    this.isLoading = true;
    console.log('no get rover', this.typeCameraSelected, this.typeCamera, dateSelected)
    this.roverPhotos.getRoverMarsPhotos(this.typeCameraSelected, dateSelected).subscribe(
      (data) => {
        this.roverPhotosInfo = data;
        if(data.photos.length == 0){
          this.showSnackbarAlert('Sem fotos encontradas, selecione outra data ou câmera', 'fechar')
        }
        console.log('teste malucoide', data)
        this.isLoading = false;
      }
    )
  }

  showSnackbarAlert(message: string, action: string) {
      this.snackBarService.openSnackBar(message, action)
  }
}
