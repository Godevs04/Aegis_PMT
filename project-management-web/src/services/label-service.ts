import apiClient from './api-client';

export interface Label {
  _id: string;
  name: string;
  color: string;
  workspaceId: string;
}

export const labelService = {
  async getByWorkspace(workspaceId: string): Promise<Label[]> {
    const response = await apiClient.get(`/labels?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async create(data: { name: string; color: string; workspaceId: string }): Promise<Label> {
    const response = await apiClient.post('/labels', data);
    return response.data.data;
  },

  async update(labelId: string, data: { name?: string; color?: string }): Promise<Label> {
    const response = await apiClient.patch(`/labels/${labelId}`, data);
    return response.data.data;
  },

  async delete(labelId: string): Promise<void> {
    await apiClient.delete(`/labels/${labelId}`);
  },
};

export default labelService;
