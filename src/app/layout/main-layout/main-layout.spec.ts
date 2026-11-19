
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('debe crear el Main Layout correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el nombre de Vehitrack Empresarial', () => {
    const compiled: HTMLElement = fixture.nativeElement;

    expect(compiled.querySelector('h1')?.textContent)
      .toContain('Vehitrack Empresarial');
  });

  it('debe mostrar las siete opciones de navegación', () => {
    const compiled: HTMLElement = fixture.nativeElement;

    const enlaces = compiled.querySelectorAll(
      'nav.sidebar-nav a.nav-link'
    );

    expect(enlaces.length).toBe(7);
  });

  it('debe contener el RouterOutlet para los módulos', () => {
    const compiled: HTMLElement = fixture.nativeElement;

    expect(
      compiled.querySelector('main router-outlet')
    ).not.toBeNull();
  });
});
