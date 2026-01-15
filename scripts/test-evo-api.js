
// Using global fetch (Node 18+)

const EVOLUTION_API_URL = "https://evo.grupoeliteempresarial.com.br";
const EVOLUTION_API_KEY = "1e24dfb410fc376316b652dc428f89ed";

async function testEvolution() {
    try {
        console.log("Fetching all instances...");
        const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            headers: { "apikey": EVOLUTION_API_KEY }
        });
        const instances = await res.json();
        console.log("Instances found:", instances.length);

        if (instances.length > 0) {
            const first = instances[0];
            const name = first.instanceName || first.name;
            console.log(`Testing webhook set for ${name}...`);

            const webhookUrl = "https://webhook.grupoeliteempresarial.com.br/webhook/904168ee-3de9-432b-b03f-398c4fd249b6";

            const payload = {
                webhook: {
                    url: webhookUrl,
                    enabled: true,
                    webhook_by_events: true,
                    events: ["MESSAGES_UPSERT"]
                }
            };

            console.log("Sending Payload:", JSON.stringify(payload, null, 2));

            const setRes = await fetch(`${EVOLUTION_API_URL}/webhook/set/${name}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": EVOLUTION_API_KEY
                },
                body: JSON.stringify(payload)
            });

            const setData = await setRes.json();
            console.log(`Response from /webhook/set/${name}:`, JSON.stringify(setData, null, 2));
        }

    } catch (err) {
        console.error("Test failed:", err);
    }
}

testEvolution();
