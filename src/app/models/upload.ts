
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface FileModel {
    id: number;
    name: string;
    mimetype: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    path: string;
    owner?: any;
    createdAt?: Date;
    updatedAt?: Date;
    isStarred?: boolean;
    isShared?: boolean;
}
export interface Folder {
    id?: number;
    name: string;
    path: string;
    accessType?: 'editor' | 'lector';
    owner?: any;
    isStarred?: boolean;
    isShared?: boolean;
}