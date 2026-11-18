import { Component } from '@angular/core';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';

@Component({
	selector: 'app-error-page',
	templateUrl: './error-page.component.html',
	styleUrls: ['./error-page.component.scss'],
	imports: [ErrorStateComponent]
})
export class ErrorPageComponent {}
