import { Client } from "minio";

const minioClient = new Client({
  endPoint: "localhost",
  port: 9000,
  useSSL: false,
  accessKey: "minio",
  secretKey: "minio123",
});

export default minioClient;
