import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    constructor(public input: unknown) {}
  }

  return {
    PutObjectCommand: Command,
    GetObjectCommand: Command,
    ListObjectsV2Command: Command,
    DeleteObjectCommand: Command,
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("../../src/lib/r2_connect", () => ({
  default: { send: vi.fn() },
  R2_BUCKET: "test-bucket",
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Repository } from "../../src/repositories/r2.repository";
import S3 from "../../src/lib/r2_connect";

const send = vi.mocked(S3.send);
const signed = vi.mocked(getSignedUrl);

describe("r2Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a file", async () => {
    send.mockResolvedValueOnce({ ETag: "etag" } as never);

    await expect(
      r2Repository.uploadFile(Buffer.from("hello"), "uploads/file.txt")
    ).resolves.toEqual({ ETag: "etag" });
  });

  it("throws when uploading fails", async () => {
    send.mockRejectedValueOnce(new Error("upload failed"));

    await expect(
      r2Repository.uploadFile(Buffer.from("hello"), "uploads/file.txt")
    ).rejects.toThrow("upload failed");
  });

  it("creates signed upload and download URLs", async () => {
    signed.mockResolvedValue("https://signed" as never);

    await expect(
      r2Repository.getSignedUrlForUpload("file.txt", "text/plain")
    ).resolves.toBe("https://signed");
    await expect(
      r2Repository.getSignedUrlForDownload("file.txt")
    ).resolves.toBe("https://signed");
  });

  it("throws when signing fails", async () => {
    signed.mockRejectedValueOnce(new Error("sign failed"));
    await expect(
      r2Repository.getSignedUrlForUpload("file.txt", "text/plain")
    ).rejects.toThrow("sign failed");

    signed.mockRejectedValueOnce(new Error("sign failed"));
    await expect(
      r2Repository.getSignedUrlForDownload("file.txt")
    ).rejects.toThrow("sign failed");
  });

  it("lists files", async () => {
    send.mockResolvedValueOnce({
      Contents: [{ Key: "uploads/file.txt" }],
    } as never);

    await expect(r2Repository.listFiles("uploads/")).resolves.toEqual([
      { Key: "uploads/file.txt" },
    ]);
  });

  it("returns an empty list when the bucket has no contents", async () => {
    send.mockResolvedValueOnce({} as never);

    await expect(r2Repository.listFiles()).resolves.toEqual([]);
  });

  it("throws when listing fails", async () => {
    send.mockRejectedValueOnce(new Error("list failed"));

    await expect(r2Repository.listFiles()).rejects.toThrow("list failed");
  });

  it("deletes a file", async () => {
    send.mockResolvedValueOnce({ $metadata: {} } as never);

    await expect(r2Repository.deleteFile("file.txt")).resolves.toEqual({
      $metadata: {},
    });
  });

  it("throws when deleting fails", async () => {
    send.mockRejectedValueOnce(new Error("delete failed"));

    await expect(r2Repository.deleteFile("file.txt")).rejects.toThrow(
      "delete failed"
    );
  });
});
