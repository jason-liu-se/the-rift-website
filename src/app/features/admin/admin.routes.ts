import { inject } from '@angular/core';
import {
	CanActivateFn,
	CanMatchFn,
	ResolveFn,
	Router,
	Routes,
	UrlMatchResult,
	UrlMatcher
} from '@angular/router';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { CollectionsModal } from './collections-modal/collections-modal';
import { BulkCreateModal } from './bulk-create-modal/bulk-create-modal';
import { EditorListPage } from './editor-list-page/editor-list-page';
import { EditorModal } from './editor-modal/editor-modal';
import { EDITOR_TYPES, EDITOR_TYPE_ORDER } from './editor-type-configs';
import { ADMIN_PATH } from 'src/app/core/config/site-paths';

const isEditorType: CanMatchFn = (_, [segment]) =>
	EDITOR_TYPE_ORDER.includes(segment.path as EditorContentType);

const toolTitle: ResolveFn<string> = (route) =>
	`${EDITOR_TYPES[route.paramMap.get('type') as EditorContentType].label} · Admin`;

/** A tool's page (`bulk`, `collections`) only for types with `feature`. */
const typeHas =
	(feature: 'hasBulkCreate' | 'hasCollections'): CanActivateFn =>
	(route) => {
		const type = route.parent!.paramMap.get('type') as EditorContentType;
		return (
			EDITOR_TYPES[type][feature] ||
			inject(Router).createUrlTree([ADMIN_PATH, type])
		);
	};

/**
 * The editor modal's URLs, as one route so the modal stays open when a new
 * item's draft gets its own URL: `new`, `drafts/<draftId>`, or `<id>`.
 */
const matchEditorItem: UrlMatcher = (segments): UrlMatchResult | null => {
	const [first, second] = segments;
	if (segments.length === 1 && first.path === 'new') {
		return { consumed: segments };
	}
	if (segments.length === 2 && first.path === 'drafts') {
		return { consumed: segments, posParams: { draftId: second } };
	}
	if (segments.length === 1) {
		return { consumed: segments, posParams: { id: first } };
	}
	return null;
};

/** Under /admin: each tool's list, with creating and editing in modals over it. */
export default [
	{ path: '', pathMatch: 'full', redirectTo: EDITOR_TYPE_ORDER[0] },
	{
		path: ':type',
		canMatch: [isEditorType],
		title: toolTitle,
		component: EditorListPage,
		children: [
			{
				path: 'bulk',
				canActivate: [typeHas('hasBulkCreate')],
				canDeactivate: [
					(modal: BulkCreateModal) => modal.confirmLeave()
				],
				component: BulkCreateModal
			},
			{
				path: 'collections',
				canActivate: [typeHas('hasCollections')],
				component: CollectionsModal
			},
			{ matcher: matchEditorItem, component: EditorModal }
		]
	}
] satisfies Routes;
