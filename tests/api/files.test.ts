import { beforeEach, describe, expect, it, vi } from "vitest";

const signedUrl = "https://bucket.example.com/signed-url";

vi.mock("../../src/repositories/r2.repository", () => ({
  r2Repository: {
    uploadFile: vi.fn(),
    getSignedUrlForUpload: vi.fn(async () => signedUrl),
    getSignedUrlForDownload: vi.fn(async () => signedUrl),
    listFiles: vi.fn(async () => [
      { Key: "uploads/image.jpeg", Size: 1024 },
    ]),
    deleteFile: vi.fn(async () => ({ $metadata: { httpStatusCode: 204 } })),
  },
}));

import {
  DELETE as deleteFile,
  GET as listFiles,
  POST as download,
} from "../../src/app/api/files/route";
import { POST as upload } from "../../src/app/api/files/upload/route";
import { r2Repository } from "../../src/repositories/r2.repository";
import { apiRequest, readJson } from "../helpers/requests";

describe("GET /api/files (ListFiles)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists files from the requested prefix", async () => {
    const response = await listFiles(
      apiRequest("/api/files", {
        searchParams: { prefix: "uploads/" },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([
      { Key: "uploads/image.jpeg", Size: 1024 },
    ]);
    expect(r2Repository.listFiles).toHaveBeenCalledWith("uploads/");
  });

  it("defaults to an empty prefix", async () => {
    const response = await listFiles(apiRequest("/api/files"));

    expect(response.status).toBe(200);
    expect(r2Repository.listFiles).toHaveBeenCalledWith("");
  });

  it("returns 500 when listing fails", async () => {
    vi.mocked(r2Repository.listFiles).mockRejectedValueOnce(
      new Error("r2 down")
    );

    const response = await listFiles(apiRequest("/api/files"));

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toMatchObject({
      message: "Error listing files",
      error: "r2 down",
    });
  });
});

describe("POST /api/files (GetDownloadUrl)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a signed download URL", async () => {
    const response = await download(
      apiRequest("/api/files", {
        method: "POST",
        body: { key: "image.jpeg" },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ url: signedUrl });
    expect(r2Repository.getSignedUrlForDownload).toHaveBeenCalledWith(
      "image.jpeg"
    );
  });

  it("returns 400 when key is missing", async () => {
    const response = await download(
      apiRequest("/api/files", { method: "POST", body: {} })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      message: "Key is required",
    });
  });

  it("returns 500 when signing fails", async () => {
    vi.mocked(r2Repository.getSignedUrlForDownload).mockRejectedValueOnce(
      new Error("sign failed")
    );

    const response = await download(
      apiRequest("/api/files", {
        method: "POST",
        body: { key: "image.jpeg" },
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/files/upload (GetUploadUrl)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a signed upload URL", async () => {
    const response = await upload(
      apiRequest("/api/files/upload", {
        method: "POST",
        body: { fileName: "image.jpeg", fileType: "image/jpeg" },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ url: signedUrl });
    expect(r2Repository.getSignedUrlForUpload).toHaveBeenCalledWith(
      "image.jpeg",
      "image/jpeg"
    );
  });

  it("returns 400 when fileName or fileType is missing", async () => {
    const response = await upload(
      apiRequest("/api/files/upload", {
        method: "POST",
        body: { fileName: "image.jpeg" },
      })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      message: "FileName and FileType are required",
    });
  });

  it("returns 500 when signing fails", async () => {
    vi.mocked(r2Repository.getSignedUrlForUpload).mockRejectedValueOnce(
      new Error("sign failed")
    );

    const response = await upload(
      apiRequest("/api/files/upload", {
        method: "POST",
        body: { fileName: "image.jpeg", fileType: "image/jpeg" },
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/files (DeleteFile)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a file", async () => {
    const response = await deleteFile(
      apiRequest("/api/files", {
        method: "DELETE",
        body: { key: "test.jpg" },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      message: "File deleted successfully",
    });
    expect(r2Repository.deleteFile).toHaveBeenCalledWith("test.jpg");
  });

  it("returns 400 when key is missing", async () => {
    const response = await deleteFile(
      apiRequest("/api/files", { method: "DELETE", body: {} })
    );

    expect(response.status).toBe(400);
  });

  it("returns 500 when deletion fails", async () => {
    vi.mocked(r2Repository.deleteFile).mockRejectedValueOnce(
      new Error("delete failed")
    );

    const response = await deleteFile(
      apiRequest("/api/files", {
        method: "DELETE",
        body: { key: "test.jpg" },
      })
    );

    expect(response.status).toBe(500);
  });
});
