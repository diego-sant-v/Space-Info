import { Component, OnInit } from '@angular/core';
import { DonkiService } from '../../services/donki/donki.service';
import { SnackbarService } from '../../services/components/snackbar.service';
import { TranslateService } from '../../services/translate/translate.service';

@Component({
  selector: 'app-space-weather',
  templateUrl: './space-weather.component.html',
  styleUrls: ['./space-weather.component.scss']
})
export class SpaceWeatherComponent implements OnInit {
  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasSearched = false;

  // Data range - últimos 30 dias por padrão
  endDate: Date = new Date();
  startDate: Date = new Date(new Date().setDate(new Date().getDate() - 30));
  maxDate: Date = new Date();
  minDate: Date = new Date('2010-01-01');

  // Dados
  cmeEvents: any[] = [];
  gstEvents: any[] = [];
  flareEvents: any[] = [];
  sepEvents: any[] = [];

  // Stats
  totalEvents = 0;
  maxKpIndex = 0;
  strongestFlare = '';
  activeTab: 'overview' | 'cme' | 'gst' | 'flares' | 'sep' = 'overview';

  constructor(
    private donkiService: DonkiService,
    private snackBarService: SnackbarService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
  }

  searchWeather() {
    if (!this.startDate || !this.endDate) {
      this.snackBarService.openSnackBar('Selecione as datas', 'Fechar');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.hasSearched = true;
    this.errorMessage = '';

    this.donkiService.getAllSpaceWeather(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.cmeEvents = data.cme || [];
        this.gstEvents = data.gst || [];
        this.flareEvents = data.flr || [];
        this.sepEvents = data.sep || [];

        this.calculateStats();
        this.translateAllEvents();
        this.isLoading = false;

        this.totalEvents = this.cmeEvents.length + this.gstEvents.length + this.flareEvents.length + this.sepEvents.length;

        if (this.totalEvents === 0) {
          this.snackBarService.openSnackBar('Nenhum evento encontrado neste período', 'OK');
        } else {
          this.snackBarService.openSnackBar(`${this.totalEvents} evento(s) detectado(s)!`, 'OK');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar dados DONKI', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados de clima espacial.';
        this.snackBarService.openSnackBar('Erro ao carregar dados.', 'Fechar');
      }
    });
  }

  private calculateStats() {
    // Maior Kp Index
    this.maxKpIndex = 0;
    this.gstEvents.forEach(gst => {
      if (gst.allKpIndex) {
        gst.allKpIndex.forEach((kp: any) => {
          const val = parseFloat(kp.kpIndex);
          if (val > this.maxKpIndex) this.maxKpIndex = val;
        });
      }
    });

    // Maior explosão solar
    this.strongestFlare = '';
    let flareRank = 0;
    this.flareEvents.forEach(flare => {
      const rank = this.getFlareRank(flare.classType);
      if (rank > flareRank) {
        flareRank = rank;
        this.strongestFlare = flare.classType || 'N/A';
      }
    });
  }

  private translateAllEvents() {
    // Traduz notas dos eventos CME
    this.cmeEvents.forEach(event => {
      if (event.note) {
        event.translating = true;
        this.translateService.translate(event.note).subscribe(translated => {
          event.note_pt = translated;
          event.translating = false;
        });
      }
    });

    // Traduz notas dos eventos GST
    this.gstEvents.forEach(event => {
      if (event.link) {
        // GST não tem campo note, mas pode ter link
      }
    });

    // Traduz notas dos eventos SEP
    this.sepEvents.forEach(event => {
      if (event.link) {
        // SEP não tem campo note direto
      }
    });
  }

  private getFlareRank(classType: string): number {
    if (!classType) return 0;
    const letter = classType.charAt(0).toUpperCase();
    const num = parseFloat(classType.substring(1)) || 0;
    switch (letter) {
      case 'A': return 1 + num / 10;
      case 'B': return 2 + num / 10;
      case 'C': return 3 + num / 10;
      case 'M': return 4 + num / 10;
      case 'X': return 5 + num / 10;
      default: return 0;
    }
  }

  getStormLevel(kpIndex: number) {
    return this.donkiService.getStormLevel(kpIndex);
  }

  getFlareIntensity(classType: string) {
    return this.donkiService.getFlareIntensity(classType);
  }

  getMaxKp(gst: any): number {
    if (!gst.allKpIndex || gst.allKpIndex.length === 0) return 0;
    return Math.max(...gst.allKpIndex.map((kp: any) => parseFloat(kp.kpIndex) || 0));
  }

  getOverallThreatLevel(): { level: string; color: string; icon: string } {
    if (this.maxKpIndex >= 7 || this.strongestFlare.startsWith('X')) {
      return { level: 'ALTO', color: '#ff0040', icon: '🔴' };
    }
    if (this.maxKpIndex >= 5 || this.strongestFlare.startsWith('M')) {
      return { level: 'MODERADO', color: '#ff8c00', icon: '🟠' };
    }
    if (this.totalEvents > 0) {
      return { level: 'BAIXO', color: '#ffd700', icon: '🟡' };
    }
    return { level: 'CALMO', color: '#00ff88', icon: '🟢' };
  }

  setTab(tab: 'overview' | 'cme' | 'gst' | 'flares' | 'sep') {
    this.activeTab = tab;
  }
}
