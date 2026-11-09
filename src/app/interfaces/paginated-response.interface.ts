// Response shapes shared by The Rift API's paginated endpoints.

export interface ICountResponse {
	total: number;
}

export interface IPaginatedResponse<T> extends ICountResponse {
	items: T[];
}
