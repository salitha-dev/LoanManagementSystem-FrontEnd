import { createResourceService } from './resource';
import { Reference } from './types';
import { AuditFields } from './admin.service';

export interface MainSector extends AuditFields {
	id: number;
	main_sector_code: string;
	main_sector_name: string;
	description: string | null;
	sub_sectors_count?: number;
}

export interface SubSector extends AuditFields {
	id: number;
	main_sector_id: number;
	sub_sector_code: string;
	sub_sector_name: string;
	description: string | null;
	main_sector?: Reference | null;
	sectors_count?: number;
}

/** The main sector is derived through the sub sector (not stored on sectors). */
export interface Sector extends AuditFields {
	id: number;
	sub_sector_id: number;
	sector_code: string;
	sector_name: string;
	description: string | null;
	sub_sector?: Reference | null;
	main_sector?: Reference | null;
}

export interface Title extends AuditFields {
	id: number;
	title_code: string;
	title_name: string;
}

export interface Relationship extends AuditFields {
	id: number;
	relationship_code: string;
	relationship_name: string;
}

export type MainSectorPayload = Pick<
	MainSector,
	'main_sector_code' | 'main_sector_name' | 'description'
>;
export type SubSectorPayload = Pick<
	SubSector,
	'main_sector_id' | 'sub_sector_code' | 'sub_sector_name' | 'description'
>;
/** main_sector_id is sent only so the API can check the chain. */
export type SectorPayload = Pick<
	Sector,
	'sub_sector_id' | 'sector_code' | 'sector_name' | 'description'
> & {
	main_sector_id: number | null;
};
export type TitlePayload = Pick<Title, 'title_code' | 'title_name'>;
export type RelationshipPayload = Pick<Relationship, 'relationship_code' | 'relationship_name'>;

export const mainSectorService = createResourceService<MainSector, MainSectorPayload>(
	'/main-sectors',
);
export const subSectorService = createResourceService<SubSector, SubSectorPayload>('/sub-sectors');
export const sectorService = createResourceService<Sector, SectorPayload>('/sectors');
export const titleService = createResourceService<Title, TitlePayload>('/titles');
export const relationshipService = createResourceService<Relationship, RelationshipPayload>(
	'/relationships',
);
