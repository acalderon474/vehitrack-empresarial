
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {

  let service: ApiService;
  let httpMock: HttpTestingController;

  const urlOriginal = environment.apiBaseUrl;
  const apiUrl = 'https://api.test.local/api/v1';

  beforeEach(() => {

    environment.apiBaseUrl = apiUrl;

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);

  });

  afterEach(() => {
    httpMock.verify();
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe crear el servicio HTTP', () => {
    expect(service).toBeTruthy();
  });

  it('debe realizar una solicitud GET', () => {

    const vehiculos = [
      { id: '1', placa: 'KLA-452' }
    ];

    service.get<typeof vehiculos>('vehiculos')
      .subscribe(respuesta => {
        expect(respuesta).toEqual(vehiculos);
      });

    const req = httpMock.expectOne(
      `${apiUrl}/vehiculos`
    );

    expect(req.request.method).toBe('GET');

    req.flush(vehiculos);

  });

  it('debe realizar una solicitud POST', () => {

    const nuevoVehiculo = {
      placa: 'KLA-452',
      capacidad_pasajeros: 15
    };

    service.post<unknown>(
      'vehiculos',
      nuevoVehiculo
    ).subscribe(respuesta => {
      expect(respuesta).toEqual({ id: '1' });
    });

    const req = httpMock.expectOne(
      `${apiUrl}/vehiculos`
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevoVehiculo);

    req.flush({ id: '1' });

  });

  it('debe realizar una solicitud PUT', () => {

    const cambios = {
      disponible: false
    };

    service.put<unknown>(
      'vehiculos/1',
      cambios
    ).subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/vehiculos/1`
    );

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambios);

    req.flush({ actualizado: true });

  });

  it('debe realizar una solicitud PATCH', () => {

    const cambios = {
      disponible: true
    };

    service.patch<unknown>(
      'vehiculos/1',
      cambios
    ).subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/vehiculos/1`
    );

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(cambios);

    req.flush({ actualizado: true });

  });

  it('debe propagar correctamente los errores HTTP', () => {

    let codigoError = 0;

    service.get<unknown>('vehiculos')
      .subscribe({
        next: () => {
          throw new Error('No se esperaba una respuesta exitosa');
        },
        error: error => {
          codigoError = error.status;
        }
      });

    const req = httpMock.expectOne(
      `${apiUrl}/vehiculos`
    );

    req.flush(
      { mensaje: 'Error del servidor' },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );

    expect(codigoError).toBe(500);

  });

});
