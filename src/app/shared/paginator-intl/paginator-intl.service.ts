import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable({
	providedIn: 'root'
})
export class PaginatorIntlService extends MatPaginatorIntl {
	override getRangeLabel = (
		page: number,
		pageSize: number,
		length: number
	): string => {
		return `Page ${page + 1} of ${Math.max(1, Math.ceil(length / pageSize))}`;
	};
}
