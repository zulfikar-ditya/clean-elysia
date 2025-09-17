export interface UserInformation {
	id: string;
	name: string;
	email: string;
	roles: string[];
	permissions: {
		name: string;
		permissions: string[];
	}[];
}
