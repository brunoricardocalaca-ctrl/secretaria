export class EvolutionClient {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = process.env.EVOLUTION_API_URL || "https://api.evolution-api.com";
        this.apiKey = process.env.EVOLUTION_API_KEY || "";
    }

    private async request(endpoint: string, method: string = "GET", body?: any) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "apikey": this.apiKey,
        };

        const config: RequestInit = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        const res = await fetch(url, config);

        // Handle empty responses safely (like HTTP 204 No Content)
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
            console.error(`[EvolutionClient Error] ${method} ${endpoint}:`, data);
            throw new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
        }

        return data;
    }

    async createInstance(instanceName: string, token: string) {
        // Evolution API v2: /instance/create
        return this.request("/instance/create", "POST", {
            instanceName,
            token,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS", // Required for some v2 installations
        });
    }

    async connectInstance(instanceName: string) {
        // Evolution API v2: /instance/connect/{instance}
        return this.request(`/instance/connect/${instanceName}`, "GET");
    }

    async logoutInstance(instanceName: string) {
        return this.request(`/instance/logout/${instanceName}`, "DELETE");
    }

    async deleteInstance(instanceName: string) {
        return this.request(`/instance/delete/${instanceName}`, "DELETE");
    }

    async fetchInstances() {
        return this.request("/instance/fetchInstances", "GET");
    }

    // Webhook Management - Crucial for n8n & Logical Pause
    async setWebhook(instanceName: string, url: string, events: string[], enabled: boolean = true) {
        return this.request(`/webhook/set/${instanceName}`, "POST", {
            webhook: {
                url,
                enabled,
                webhook_by_events: true,
                events,
            }
        });
    }

    async findWebhook(instanceName: string) {
        return this.request(`/webhook/find/${instanceName}`, "GET");
    }

    // Messaging
    async sendText(instanceName: string, number: string, text: string) {
        return this.request(`/message/sendText/${instanceName}`, "POST", {
            number,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: true,
            },
            textMessage: {
                text,
            },
        });
    }

    async sendMedia(instanceName: string, number: string, mediaUrl: string, caption?: string, fileName?: string) {
        return this.request(`/message/sendMedia/${instanceName}`, "POST", {
            number,
            options: {
                delay: 1200,
                presence: "composing",
            },
            mediaMessage: {
                mediatype: "document",
                media: mediaUrl,
                caption: caption || "",
                fileName: fileName || "document.pdf"
            },
        });
    }

    // Contact Info
    async getContact(instanceName: string, number: string) {
        try {
            return await this.request(`/chat/findContact/${instanceName}`, "POST", {
                number
            });
        } catch (error) {
            console.error("Error fetching contact:", error);
            return null;
        }
    }
}
