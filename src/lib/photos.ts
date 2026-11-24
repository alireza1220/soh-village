import type { L } from "./i18n";

// Add photos to public/photos/ and list them here. Only photos Al or the family own or have permission for.
export type Photo = { file: string; alt: L; caption: L; credit: string };
export const photos: Photo[] = [];
