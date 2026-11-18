import { PaginatorIntlService } from './paginator-intl.service';

describe('PaginatorIntlService', () => {
	const intl = new PaginatorIntlService();

	it.each([
		{ page: 0, pageSize: 10, length: 25, label: 'Page 1 of 3' },
		{ page: 2, pageSize: 10, length: 25, label: 'Page 3 of 3' },
		{ page: 1, pageSize: 10, length: 20, label: 'Page 2 of 2' },
		{ page: 0, pageSize: 30, length: 31, label: 'Page 1 of 2' },
		{ page: 0, pageSize: 10, length: 5, label: 'Page 1 of 1' },
		{ page: 0, pageSize: 10, length: 0, label: 'Page 1 of 1' }
	])(
		'labels page index $page of $length items ($pageSize per page) "$label"',
		({ page, pageSize, length, label }) => {
			expect(intl.getRangeLabel(page, pageSize, length)).toBe(label);
		}
	);
});
