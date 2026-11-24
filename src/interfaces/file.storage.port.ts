import { DeleteObjectCommandOutput } from '@aws-sdk/client-s3';
import { FileObject } from '../models/FileObject';

/**
 * R-06 (H-07): contrato del almacenamiento de archivos que FileService necesita.
 * r2Repository ya lo cumple por compatibilidad estructural (no incluye uploadFile
 * porque FileService no lo usa).
 */
export interface FileStoragePort {
    getSignedUrlForUpload(key: string, contentType: string): Promise<string>;
    getSignedUrlForDownload(key: string): Promise<string>;
    listFiles(prefix?: string): Promise<FileObject[]>;
    deleteFile(key: string): Promise<DeleteObjectCommandOutput>;
}
