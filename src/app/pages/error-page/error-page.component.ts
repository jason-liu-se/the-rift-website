import { Component } from '@angular/core';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';

@Component({
	selector: 'app-error-page',
	templateUrl: './error-page.component.html',
	styleUrls: ['./error-page.component.scss'],
	imports: [FallbackPanelComponent]
})
export class ErrorPageComponent {}
