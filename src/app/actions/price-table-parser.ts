"use server";

import * as XLSX from 'xlsx';
const pdf = require('pdf-parse');
import { getSystemConfig } from './admin-settings';

export async function parsePriceTableFile(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { error: "Nenhum arquivo enviado." };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        let extractedText = "";

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            extractedText = XLSX.utils.sheet_to_csv(worksheet);
        } else if (fileName.endsWith('.pdf')) {
            const data = await pdf(buffer);
            extractedText = data.text;
        } else {
            return { error: "Formato de arquivo não suportado. Use PDF ou XLSX." };
        }

        if (!extractedText || extractedText.trim().length < 5) {
            return { error: "O arquivo parece estar vazio ou não foi possível extrair o texto." };
        }

        const apiKey = await getSystemConfig("openai_api_key");
        if (!apiKey) {
            return { error: "Chave da OpenAI não configurada." };
        }

        const systemPrompt = `Você é um assistente especializado em extrair tabelas de preços de documentos.
        Sua tarefa é analisar o texto extraído de um arquivo (PDF ou Excel) e organizar os serviços e preços em uma estrutura JSON específica.
        
        REGRAS:
        1. Identifique grupos de serviços (ex: "Cabelo", "Rosto", "Corpo") e seus respectivos itens e preços.
        2. Se não houver grupos claros, use um título genérico como "Serviços".
        3. No campo "price", retorne apenas o número (ex: "150.00" em vez de "R$ 150,00").
        4. No campo "name", use o nome comercial do serviço encontrado.
        
        ESTRUTURA JSON ESPERADA (Array de Objetos):
        [
          {
            "title": "Nome do Grupo",
            "items": [
              { "name": "Nome do Serviço", "price": "150.00" },
              { "name": "Outro Serviço", "price": "200.00" }
            ]
          }
        ]
        
        Retorne APENAS o JSON válido, sem explicações ou markdown.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Texto Extraído do Arquivo:\n\n${extractedText.substring(0, 15000)}` }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            return { error: "Falha na comunicação com a IA." };
        }

        const aiData = await response.json();
        const content = aiData.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            // OpenAI might wrap it in a root object like { "priceTable": [...] } or just return the array if prompted
            // Let's handle both
            const finalData = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];

            if (!Array.isArray(finalData)) {
                return { error: "A IA não conseguiu estruturar os dados corretamente." };
            }

            return { success: true, data: finalData };
        } catch (e) {
            return { error: "Erro ao processar a resposta da IA." };
        }

    } catch (error: any) {
        console.error("Price Table Parse Error:", error);
        return { error: error.message || "Erro desconhecido ao processar arquivo." };
    }
}
