import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from 'src/environments/environment';

import { BlueMapPageComponent } from './blue-map-page.component';

const VIEWER = '/map/viewer';
const OVERWORLD = 's6_overworld:0:0:0:1500:0:0:0:0:perspective';
const NETHER = 's6_nether:0:0:0:1500:0:0:0:0:perspective';
const END = 's6_end:0:0:0:1500:0:0:0:0:perspective';
const BLUEMAP_ORIGIN = new URL(environment.BLUEMAP_URL).origin;

describe('BlueMapPageComponent', () => {
	let harness: RouterTestingHarness;
	let router: Router;
	let srcWrites: MockInstance<(url: string) => void>;

	beforeEach(async () => {
		// Every URL sent to BlueMap, including one equal to the current src.
		srcWrites = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'map/viewer', component: BlueMapPageComponent }
				])
			]
		});
		router = TestBed.inject(Router);
		harness = await RouterTestingHarness.create();
		// Attached so the iframe gets a contentWindow to send messages from.
		document.body.appendChild(harness.fixture.nativeElement);
	});

	afterEach(() => {
		harness.fixture.nativeElement.remove();
		srcWrites.mockRestore();
	});

	/** Navigates as the address bar would, then lets the iframe render. */
	async function open(url: string): Promise<void> {
		await harness.navigateByUrl(url);
		TestBed.tick();
	}

	const iframe = () =>
		harness.routeNativeElement?.querySelector('iframe') ?? null;
	const sentToBlueMap = () => srcWrites.mock.calls.map(([url]) => url);
	const blueMapUrl = (fragment: string) =>
		`${environment.BLUEMAP_URL}/#${fragment}`;

	async function sendFromBlueMap(
		data: unknown,
		{ origin = BLUEMAP_ORIGIN, source = iframe()?.contentWindow } = {}
	): Promise<void> {
		window.dispatchEvent(
			new MessageEvent('message', { data, origin, source })
		);
		await harness.fixture.whenStable();
		TestBed.tick();
	}

	it('opens BlueMap at the view in the URL fragment', async () => {
		await open(`${VIEWER}#${OVERWORLD}`);

		expect(sentToBlueMap()).toEqual([blueMapUrl(OVERWORLD)]);
	});

	it("opens BlueMap's default view when the URL has no fragment", async () => {
		await open(VIEWER);

		expect(sentToBlueMap()).toEqual([`${environment.BLUEMAP_URL}/`]);
	});

	it('moves BlueMap to a new view when the URL fragment changes', async () => {
		await open(`${VIEWER}#${OVERWORLD}`);
		await open(`${VIEWER}#${NETHER}`);

		expect(sentToBlueMap().at(-1)).toBe(blueMapUrl(NETHER));
	});

	describe('when BlueMap reports a new view', () => {
		beforeEach(() => open(`${VIEWER}#${OVERWORLD}`));

		it('copies it into the URL without sending it back to BlueMap', async () => {
			await sendFromBlueMap({ type: 'bluemap:hash', hash: NETHER });

			expect(router.url).toBe(`${VIEWER}#${NETHER}`);
			expect(sentToBlueMap()).toEqual([blueMapUrl(OVERWORLD)]);
		});

		it('keeps the query string', async () => {
			await open(`${VIEWER}?ref=discord#${OVERWORLD}`);
			await sendFromBlueMap({ type: 'bluemap:hash', hash: NETHER });

			expect(router.url).toBe(`${VIEWER}?ref=discord#${NETHER}`);
		});

		it('still sends BlueMap a view typed into the address bar', async () => {
			await sendFromBlueMap({ type: 'bluemap:hash', hash: NETHER });
			await open(`${VIEWER}#${END}`);

			expect(sentToBlueMap().at(-1)).toBe(blueMapUrl(END));
		});

		it('sends BlueMap back to the view it opened at', async () => {
			await sendFromBlueMap({ type: 'bluemap:hash', hash: NETHER });
			await open(`${VIEWER}#${OVERWORLD}`);

			expect(sentToBlueMap()).toEqual([
				blueMapUrl(OVERWORLD),
				blueMapUrl(OVERWORLD)
			]);
		});

		it('ignores messages from another origin or window', async () => {
			const message = { type: 'bluemap:hash', hash: NETHER };
			await sendFromBlueMap(message, { origin: 'https://evil.example' });
			await sendFromBlueMap(message, { source: window });

			expect(router.url).toBe(`${VIEWER}#${OVERWORLD}`);
		});

		it('ignores other messages from BlueMap', async () => {
			await sendFromBlueMap({ type: 'other', hash: NETHER });
			await sendFromBlueMap({ type: 'bluemap:hash', hash: '' });

			expect(router.url).toBe(`${VIEWER}#${OVERWORLD}`);
		});
	});
});
