import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SpyLocation, provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from 'src/environments/environment';

import { BlueMapPage } from './blue-map-page';

const VIEWER = '/map/viewer';
const OVERWORLD = 's6_overworld:0:0:0:1500:0:0:0:0:perspective';
const OVERWORLD_MOVED = 's6_overworld:120:64:-80:900:0:0:0:0:perspective';
const NETHER = 's6_nether:0:0:0:1500:0:0:0:0:perspective';
const END = 's6_end:0:0:0:1500:0:0:0:0:perspective';
const BLUEMAP_ORIGIN = new URL(environment.BLUEMAP_URL).origin;

describe('BlueMapPage', () => {
	let harness: RouterTestingHarness;
	let router: Router;
	let location: SpyLocation;
	// Stands in for the iframe's window, recording where BlueMap is sent.
	let blueMapWindow: { location: { replace: ReturnType<typeof vi.fn> } };

	beforeEach(async () => {
		blueMapWindow = { location: { replace: vi.fn() } };
		vi.spyOn(
			HTMLIFrameElement.prototype,
			'contentWindow',
			'get'
		).mockReturnValue(blueMapWindow as unknown as Window);
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([{ path: 'map/viewer', component: BlueMapPage }]),
				provideLocationMocks()
			]
		});
		router = TestBed.inject(Router);
		// Bootstrapping normally does this: it makes Back/Forward navigate.
		router.setUpLocationChangeListener();
		location = TestBed.inject(Location) as SpyLocation;
		harness = await RouterTestingHarness.create();
	});

	afterEach(() => vi.restoreAllMocks());

	/** Navigates as the address bar would, then lets the iframe render. */
	async function open(url: string): Promise<void> {
		await harness.navigateByUrl(url);
		TestBed.tick();
	}

	async function settle(): Promise<void> {
		await harness.fixture.whenStable();
		TestBed.tick();
	}

	/** Presses Back or Forward; the router handles it after a timeout. */
	async function goThroughHistory(step: 'back' | 'forward'): Promise<void> {
		location[step]();
		await new Promise((resolve) => setTimeout(resolve));
		await settle();
	}

	const sentToBlueMap = () =>
		blueMapWindow.location.replace.mock.calls.map(([url]) => url);
	const blueMapUrl = (fragment: string) =>
		`${environment.BLUEMAP_URL}/#${fragment}`;
	/** The last change to the browser history: a push, or `replace: <url>`. */
	const lastHistoryChange = () => location.urlChanges.at(-1);

	async function sendFromBlueMap(
		data: unknown,
		{ origin = BLUEMAP_ORIGIN, source = blueMapWindow as unknown } = {}
	): Promise<void> {
		const event = new MessageEvent('message', { data, origin });
		Object.defineProperty(event, 'source', { value: source });
		window.dispatchEvent(event);
		await settle();
	}
	const reportView = (hash: string) =>
		sendFromBlueMap({ type: 'bluemap:hash', hash });

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
		beforeEach(async () => {
			await open(`${VIEWER}#${OVERWORLD}`);
			await reportView(OVERWORLD);
		});

		it('copies it into the URL without sending it back to BlueMap', async () => {
			await reportView(NETHER);

			expect(router.url).toBe(`${VIEWER}#${NETHER}`);
			expect(sentToBlueMap()).toEqual([blueMapUrl(OVERWORLD)]);
		});

		it('replaces the history entry when only the camera moved', async () => {
			await reportView(OVERWORLD_MOVED);

			expect(lastHistoryChange()).toBe(
				`replace: ${VIEWER}#${OVERWORLD_MOVED}`
			);
		});

		it('adds a history entry when BlueMap switches to another map', async () => {
			await reportView(NETHER);

			expect(lastHistoryChange()).toBe(`${VIEWER}#${NETHER}`);
		});

		it('steps back and forward through map switches', async () => {
			await reportView(NETHER);

			await goThroughHistory('back');
			expect(sentToBlueMap().at(-1)).toBe(blueMapUrl(OVERWORLD));

			// BlueMap shows that map (its camera numbers may differ): no new
			// entry, so Forward history survives.
			await reportView(OVERWORLD_MOVED);
			expect(lastHistoryChange()).toBe(
				`replace: ${VIEWER}#${OVERWORLD_MOVED}`
			);

			await goThroughHistory('forward');

			expect(router.url).toBe(`${VIEWER}#${NETHER}`);
			expect(sentToBlueMap().at(-1)).toBe(blueMapUrl(NETHER));
		});

		it('keeps the query string', async () => {
			await open(`${VIEWER}?ref=discord#${OVERWORLD}`);
			await reportView(NETHER);

			expect(router.url).toBe(`${VIEWER}?ref=discord#${NETHER}`);
		});

		it('still sends BlueMap a view typed into the address bar', async () => {
			await reportView(NETHER);
			await open(`${VIEWER}#${END}`);

			expect(sentToBlueMap().at(-1)).toBe(blueMapUrl(END));
		});

		it('sends BlueMap back to the view it opened at', async () => {
			await reportView(NETHER);
			await open(`${VIEWER}#${OVERWORLD}`);

			expect(sentToBlueMap()).toEqual([
				blueMapUrl(OVERWORLD),
				blueMapUrl(OVERWORLD)
			]);
		});

		it('ignores messages from another origin or window', async () => {
			await sendFromBlueMap(
				{ type: 'bluemap:hash', hash: NETHER },
				{ origin: 'https://evil.example' }
			);
			await sendFromBlueMap(
				{ type: 'bluemap:hash', hash: NETHER },
				{ source: window }
			);

			expect(router.url).toBe(`${VIEWER}#${OVERWORLD}`);
		});

		it('ignores other messages from BlueMap', async () => {
			await sendFromBlueMap({ type: 'other', hash: NETHER });
			await reportView('');

			expect(router.url).toBe(`${VIEWER}#${OVERWORLD}`);
		});
	});

	it("replaces the history entry with BlueMap's first report, even for another map", async () => {
		await open(VIEWER);
		await reportView(OVERWORLD); // BlueMap's default map

		expect(lastHistoryChange()).toBe(`replace: ${VIEWER}#${OVERWORLD}`);
	});

	it("doesn't trap Back when BlueMap swaps an unknown map for its default", async () => {
		const unknown = 's6_unknown:0:0:0:1500:0:0:0:0:perspective';
		await open(`${VIEWER}#${NETHER}`);
		await reportView(NETHER);
		await open(`${VIEWER}#${unknown}`);
		await reportView(unknown); // url-sync.js echoes the hash it was sent
		await reportView(OVERWORLD); // BlueMap's fallback: a new entry

		await goThroughHistory('back'); // to the unknown map's entry
		await reportView(unknown);
		await reportView(OVERWORLD); // the same fallback again

		expect(lastHistoryChange()).toBe(`replace: ${VIEWER}#${OVERWORLD}`);
	});
});
