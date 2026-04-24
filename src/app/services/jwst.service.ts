import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JwstService {
  // Opção 1: API APOD da NASA (mais estável)
  private nasaApodUrl = 'https://api.nasa.gov/planetary/apod';

  // Opção 2: API Images da NASA (biblioteca completa)
  private nasaImagesUrl = 'https://images-api.nasa.gov/search';

  // SUA CHAVE API NASA (substitua pela sua - grátis em api.nasa.gov)
  private apiKey = 'oKwdlMfm578EctRvFZcJlhkzDVbyD6aPGTbTq7eZ';

  // Fallback: imagens locais caso a API falhe
  private fallbackImages = [
    {
      title: 'Nebulosa da Tarântula',
      url: 'https://science.nasa.gov/wp-content/uploads/2023/03/jwst-tarantula-nebula-1.jpg',
      description: 'A Nebulosa da Tarântula, capturada pelo James Webb, mostrando estrelas jovens em formação.',
      date: '2023-03-15',
      instrument: 'NIRCam'
    },
    {
      title: 'Pilares da Criação',
      url: 'https://stsci-opo.org/STScI-01GFNJ5T4V7W2W1EJ7E5W2V3K9.png',
      description: 'Os famosos Pilares da Criação vistos pelo olhar infravermelho do James Webb.',
      date: '2022-10-19',
      instrument: 'NIRCam'
    },
    {
      title: 'Nebulosa do Anel Sul',
      url: 'https://science.nasa.gov/wp-content/uploads/2023/09/southern-ring-nebula-jwst.jpg',
      description: 'Uma nebulosa planetária a 2.000 anos-luz de distância em detalhes sem precedentes.',
      date: '2022-07-12',
      instrument: 'NIRCam & MIRI'
    },
    {
      title: 'Galáxia do Girino',
      url: 'https://stsci-opo.org/STScI-01GFNNYJVWQ59M7W2S5P5KVX2H.png',
      description: 'Uma galáxia em interação com cauda de estrelas de 280.000 anos-luz de comprimento.',
      date: '2023-03-10',
      instrument: 'NIRCam'
    },
    {
      title: 'Galáxia Cartwheel',
      url: 'https://science.nasa.gov/wp-content/uploads/2023/08/cartwheel-1.jpg',
      description: 'Uma galáxia em forma de roda de carroça após uma colisão cósmica.',
      date: '2022-08-02',
      instrument: 'NIRCam & MIRI'
    },
    {
      title: 'Nebulosa de Órion',
      url: 'https://science.nasa.gov/wp-content/uploads/2023/12/orion-nebula-jwst-1.jpg',
      description: 'O berçário estelar mais famoso revelado em detalhes infravermelhos.',
      date: '2023-09-11',
      instrument: 'NIRCam'
    }
  ];

  constructor(private http: HttpClient) {}

  // Método principal: busca imagens do JWST
  getImages(page: number = 1, limit: number = 12): Observable<any> {
    // Vamos usar a API Images da NASA (mais completa)
    return this.searchNasaImages('James Webb Space Telescope', page, limit);
  }

  // Método alternativo usando APOD (Astronomy Picture of the Day)
  getApodImages(count: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('count', count.toString());

    return this.http.get(this.nasaApodUrl, { params }).pipe(
      map((response: any) => {
        // Converter APOD para formato compatível com seu componente
        return response.map((item: any) => ({
          title: item.title,
          url: item.url,
          description: item.explanation,
          date: item.date,
          instrument: item.copyright ? `© ${item.copyright}` : 'NASA/ESA/CSA'
        }));
      }),
      catchError(error => {
        console.error('Erro na API APOD:', error);
        return of(this.getFallbackImages());
      })
    );
  }

  // Busca na biblioteca de imagens da NASA
  searchNasaImages(query: string, page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('q', query)
      .set('media_type', 'image')
      .set('page', page.toString())
      .set('page_size', limit.toString());

    return this.http.get(this.nasaImagesUrl, { params }).pipe(
      map((response: any) => {
        // Converter resposta da NASA Images para o formato esperado
        const items = response.collection?.items || [];

        const images = items.map((item: any) => {
          const data = item.data[0] || {};
          const links = item.links || [];
          const imageUrl = links.find((link: any) => link.rel === 'preview')?.href || '';

          return {
            title: data.title || 'Imagem do JWST',
            url: imageUrl,
            description: data.description || 'Imagem capturada pelo Telescópio Espacial James Webb',
            date: data.date_created,
            instrument: data.secondary_creator || 'JWST',
            type: data.media_type,
            nasa_id: data.nasa_id
          };
        }).filter((img: any) => img.url); // Remove itens sem URL

        return { data: images };
      }),
      catchError(error => {
        console.error('Erro na API Images NASA:', error);
        return of({ data: this.getFallbackImages() });
      })
    );
  }

  // Fallback com imagens locais
  private getFallbackImages(): any[] {
    return this.fallbackImages;
  }

  // Métodos existentes adaptados para usar a nova API
  getImagesByType(type: string): Observable<any> {
    let searchTerm = '';
    switch(type) {
      case 'galaxies':
        searchTerm = 'James Webb galaxy';
        break;
      case 'nebulas':
        searchTerm = 'James Webb nebula';
        break;
      case 'stars':
        searchTerm = 'James Webb star';
        break;
      default:
        searchTerm = 'James Webb Space Telescope';
    }
    return this.searchNasaImages(searchTerm);
  }

  getImageById(id: string): Observable<any> {
    // Usar NASA Images API para buscar por ID
    const params = new HttpParams()
      .set('q', id)
      .set('media_type', 'image');

    return this.http.get(this.nasaImagesUrl, { params }).pipe(
      map((response: any) => {
        const items = response.collection?.items || [];
        if (items.length > 0) {
          const item = items[0];
          const data = item.data[0];
          const imageUrl = item.links?.find((link: any) => link.rel === 'preview')?.href;
          return { data: [{ title: data.title, url: imageUrl, description: data.description }] };
        }
        return { data: [] };
      })
    );
  }

  // Para usuários avançados: acesso direto à API APOD
  getSpecificDateImage(date: string): Observable<any> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('date', date);

    return this.http.get(this.nasaApodUrl, { params });
  }
}
