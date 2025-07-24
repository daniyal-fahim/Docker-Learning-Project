import amqp from "amqplib";
import express from "express";


const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

const QUEUE = "claims";

const app = express();


app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.post("/claim", async (req, res) => {

    const { tid, tuser, tamount, tstatus } = req.body;

    if (!tid || !tuser || !tamount || !tstatus) {
        return res.status(400).json({ error: "Missing required claim fields" });
    }
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE);

    const claimData = {
        id: Date.now(),
        user: tuser,
        amount: tamount,
        status: tstatus
    };

    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(claimData)));
    console.log("✅ Claim sent:", claimData);

    setTimeout(() => {
        connection.close();
        process.exit(0);
    }, 500);
    res.status(201).json({ message: "Claim submitted successfully", claim: claimData });
});

app.listen(3000, () => {
    console.log("🚀 Claim service is running on port 3000");
});
