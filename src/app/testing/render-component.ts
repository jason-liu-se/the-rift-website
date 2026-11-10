import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';

/** Routes that accept any URL, so router-link tests can check `Router.url`. */
export const ANY_URL_ROUTES: Routes = [{ path: '**', children: [] }];

/**
 * Creates a component and sets its inputs before the first change detection,
 * as a parent template would, so `ngOnInit` sees them. Only pass `@Input()`
 * properties: TypeScript can't tell decorator inputs from other public fields,
 * and setting a non-input throws NG0303 at runtime.
 */
export function renderComponent<T>(
	component: Type<T>,
	inputs: Partial<T> = {}
): ComponentFixture<T> {
	const fixture = TestBed.createComponent(component);
	for (const [name, value] of Object.entries(inputs)) {
		fixture.componentRef.setInput(name, value);
	}
	fixture.detectChanges();
	return fixture;
}
