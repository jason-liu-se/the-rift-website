import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSlideshowComponent } from './image-slideshow.component';
import { AppModule } from '../../app.module';

describe('ImageSlideshowComponent', () => {
  let component: ImageSlideshowComponent;
  let fixture: ComponentFixture<ImageSlideshowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(ImageSlideshowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('captionedImages', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
