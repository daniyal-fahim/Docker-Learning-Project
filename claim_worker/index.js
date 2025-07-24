import amqp from "amqplib"; // Correct package name
import fs from "fs";
import { Client } from "minio";  // Change the import statement

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq";
const QUEUE = "claims";
const LOG_FILE = "claims_log.txt";

// MinIO configuration
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const MINIO_PORT = parseInt(process.env.MINIO_PORT) || 9000;
const MINIO_USE_SSL = false;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "admin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "password123";
const BUCKET_NAME = "claims-bucket"; // Bucket to store claims

// Initialize MinIO client
const minioClient = new Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
});

async function receiveClaims() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE);

    console.log("📥 Waiting for claims...");

    channel.consume(QUEUE, async (msg) => {
        if (msg !== null) {
            const claim = JSON.parse(msg.content.toString());
            const logEntry = `Received Claim: ${JSON.stringify(claim)}\n`;

            // Log the claim
            fs.appendFile(LOG_FILE, logEntry, (err) => {
                if (err) {
                    console.error("❌ Error writing to file:", err);
                } else {
                    console.log("✅ Claim saved to file.");
                }
            });

            console.log("✅ Claim received and under review:", claim);

            // Store claim in MinIO
            const fileName = `claim-${claim.id}-${Date.now()}.json`;
            const claimData = JSON.stringify(claim, null, 2); // Pretty-print JSON

            try {
                // Check if bucket exists, create if it doesn't
                const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
                if (!bucketExists) {
                    await minioClient.makeBucket(BUCKET_NAME, "us-east-1"); // Region is optional
                    console.log(`✅ Bucket ${BUCKET_NAME} created.`);
                }

                // Upload the claim data to MinIO
                await minioClient.putObject(BUCKET_NAME, fileName, claimData);
                console.log(`✅ Claim ${claim.id} stored in MinIO as ${fileName}`);
            } catch (err) {
                console.error("❌ Error storing claim in MinIO:", err);
            }

            channel.ack(msg);
        }
    });
}

receiveClaims().catch(console.error);