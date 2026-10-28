import { Component } from '@angular/core';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';
import { GalleryProviderService } from 'src/app/services/gallery-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl.service';

@Component({
    selector: 'app-gallery-showcase-page',
    templateUrl: './gallery-showcase-page.component.html',
    styleUrls: ['./gallery-showcase-page.component.scss'],
    providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlService }],
    standalone: false
})
export class GalleryShowcasePageComponent {
    public title: string;
    public imageUrl: string;
    public captionedImages: ICaptionCard[] = [];
    public collectionName: string;
    public paginationLength!: number;
    public pageSize: number = 30;
    public pageIndex: number = 0;
    public pageEvent!: PageEvent;

    private imageCache: Record<string, ICaptionCard[]> = {};

    // the title and imageUrl must be passed via the app-routing.module file as
    // 'data' elements
    constructor(
        private route: ActivatedRoute,
        private galleryProvider: GalleryProviderService
    ) {
        // parsing route data
        const title = this.route.snapshot.data['title'];
        const imageUrl = this.route.snapshot.data['imageUrl'];
        const collectionName = this.route.snapshot.data['collection'];

        this.title = title == null ? 'Gallery Showcase Page' : title;
        this.imageUrl = imageUrl == null ? '' : imageUrl;
        this.collectionName = collectionName == null ? '' : collectionName;

        // preparing data for pagination
        this.galleryProvider
            .getCollectionImageCountObservable(this.collectionName)
            .subscribe((data: { count: number }) => {
                this.paginationLength = data.count;
            });

        this.populateCaptionedImages();
    }

    public handlePageEvent(e: PageEvent) {
        this.pageEvent = e;
        this.paginationLength = e.length;
        this.pageSize = e.pageSize;
        this.pageIndex = e.pageIndex;

        // updating the displayed news items
        this.captionedImages = [];

        // grabbing images from cache, if they have been cached
        if (this.imageCache[`${this.pageIndex}`]) {
            this.captionedImages = this.imageCache[`${this.pageIndex}`];
        } else {
            this.populateCaptionedImages();
        }

        window.scrollTo(0, 0);
    }

    private populateCaptionedImages(): void {
        this.galleryProvider
            .getCollectionImagesObservable(
                this.collectionName,
                this.pageIndex * this.pageSize,
                this.pageSize
            )
            .subscribe((data: ICaptionCard[]) => {
                this.captionedImages = data;

                this.imageCache[`${this.pageIndex}`] = this.captionedImages;
            });
    }
}
