import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-error-page',
	templateUrl: './error-page.component.html',
	styleUrls: ['./error-page.component.scss'],
	imports: [MatButton, RouterLink]
})
export class ErrorPageComponent {}
