import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.NODE_ENV === "development" ? "localhost" : "minio",
  port: 9000,
  useSSL: false,
  accessKey: "minio",
  secretKey: "minio123",
});

export default minioClient;
