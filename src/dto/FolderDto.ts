import { z } from "zod";

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  modifiedAt: z.string(),
  type: z.literal("folder"),
});

export type FolderDto = z.infer<typeof folderSchema>;

export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  extension: z.string(),
  size: z.string(),
  parentId: z.string(),
  modifiedAt: z.string(),
  type: z.literal("file"),
  previewStrategy: z.string(),
  webViewLink: z.string(),
});

export type FileDto = z.infer<typeof fileSchema>;

export interface FoldersResponse {
  success: boolean;
  data: {
    folders: FolderDto[];
  };
}

export interface FolderContentsResponse {
  success: boolean;
  data: {
    parentId: string | null;
    folders: FolderDto[];
    files: FileDto[];
    nextPageToken?: string;
  };
}

export type DriveItem = FileDto | FolderDto;

export interface SearchResponse {
  success: boolean;
  data: {
    items: DriveItem[];
    nextPageToken?: string;
  };
}
