import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryPageComponent } from './gallery-page.component';
import { AppModule } from '../../app.module';

describe('GalleryPageComponent', () => {
    let component: GalleryPageComponent;
    let fixture: ComponentFixture<GalleryPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppModule],
            providers: [provideHttpClientTesting()]
        });
        fixture = TestBed.createComponent(GalleryPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
