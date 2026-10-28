import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadCardComponent } from './download-card.component';
import { AppModule } from '../../app.module';

describe('DownloadCardComponent', () => {
  let component: DownloadCardComponent;
  let fixture: ComponentFixture<DownloadCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(DownloadCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
