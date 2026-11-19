
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('debe crear la aplicación correctamente', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('debe contener el RouterOutlet principal', async () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled: HTMLElement = fixture.nativeElement;

    expect(
      compiled.querySelector('router-outlet')
    ).not.toBeNull();
  });

});
