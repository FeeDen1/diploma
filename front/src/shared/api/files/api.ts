import { apiClient } from '../client';
import type { ReadFileDto, UploadFileInput } from './types';

interface MultipartFile {
  uri: string;
  name: string;
  type: string;
}

export const filesApi = {
  async upload(input: UploadFileInput): Promise<ReadFileDto> {
    const formData = new FormData();
    const file: MultipartFile = {
      uri: input.uri,
      name: input.name,
      type: input.mimeType,
    };
    // React Native поддерживает такой объект как File-like значение FormData,
    // приведение к unknown→Blob нужно для совместимости с типом FormData в TS DOM-lib.
    formData.append('file', file as unknown as Blob);

    const { data } = await apiClient.post<ReadFileDto>('/files', formData, {
      params: { type: input.type },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getById(id: string): Promise<ReadFileDto> {
    const { data } = await apiClient.get<ReadFileDto>(`/files/${id}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },
};
