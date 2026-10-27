import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlueMapPageComponent } from './blue-map-page.component';
import { AppModule } from '../../app.module';

describe('BlueMapPageComponent', () => {
    let component: BlueMapPageComponent;
    let fixture: ComponentFixture<BlueMapPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppModule],
            providers: [provideHttpClientTesting()]
        });
        fixture = TestBed.createComponent(BlueMapPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
