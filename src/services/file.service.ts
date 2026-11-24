import { r2Repository } from '../repositories/r2.repository';
import { FileObject } from '../models/FileObject';
import { DeleteObjectCommandOutput } from '@aws-sdk/client-s3';
import { FileStoragePort } from '../interfaces/file.storage.port';

export class FileService {
    // R-06 (H-07): depende del puerto; r2Repository es solo el valor por defecto.
    constructor(private storage: FileStoragePort = r2Repository) {}

    /**
     * Genera una URL firmada para que el cliente pueda subir un archivo directamente a R2
     * Esto es más eficiente que pasar el Buffer por nuestro servidor.
     */
    async getUploadUrl(key: string, contentType: string): Promise<string> {
        return await this.storage.getSignedUrlForUpload(key, contentType);
    }

    /**
     * Genera una URL firmada para descargar un archivo de forma segura.
     */
    async getDownloadUrl(key: string): Promise<string> {
        return await this.storage.getSignedUrlForDownload(key);
    }

    /**
     * Lista todos los archivos en un prefijo determinado (ej: "uploads/users/")
     */
    async listFiles(prefix: string = ''): Promise<FileObject[]> {
        return await this.storage.listFiles(prefix);
    }

    /**
     * Elimina un archivo del bucket.
     */
    async deleteFile(key: string): Promise<DeleteObjectCommandOutput> {
        return await this.storage.deleteFile(key);
    }

}