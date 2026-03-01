export type FileType = 'avatar' | 'task' | 'submission' | 'reward';
export type FileVisibility = 'public' | 'private';

export interface ReadFileDto {
  id: string;
  ownerUserId: string;
  bucket: string;
  objectKey: string;
  visibility: FileVisibility;
  mimeType: string;
  sizeBytes: number;
  type: FileType;
  url: string;
  createdAt: string;
}

export interface UploadFileInput {
  uri: string;
  name: string;
  mimeType: string;
  type: FileType;
}
