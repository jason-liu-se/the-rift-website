import { Component, RESPONSE_INIT, inject } from '@angular/core';
import { FallbackPanelComponent } from '../../../shared/ui/fallback-panel/fallback-panel.component';

@Component({
	selector: 'app-error-page',
	templateUrl: './error-page.component.html',
	styleUrls: ['./error-page.component.scss'],
	imports: [FallbackPanelComponent]
})
export class ErrorPageComponent {
	constructor() {
		// Server rendering only. The `**` server route already sends 404, but a
		// URL that a guard turns away (e.g. an unknown gallery collection) can
		// land here under a route that doesn't.
		const response = inject(RESPONSE_INIT, { optional: true });
		if (response) {
			response.status = 404;
		}
	}
}
