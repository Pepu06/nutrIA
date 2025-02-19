import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';
import fs from 'fs';

dotenv.config();

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-pro-exp-02-05",
    systemInstruction: "**Instrucción:**\n\n\"Tu tarea es actuar como un extractor de información de texto. Recibirás un texto proporcionado por el usuario que siempre contendrá una dirección postal en español y un texto adicional. Debes separar la dirección del resto del texto y estructurar la salida de la siguiente manera:\n\n**Formato de entrada del usuario:**\n\nEl texto del usuario incluirá una dirección postal y un texto adicional sobre el edificio. La dirección puede estar al principio, en medio o al final del texto.\n\n**Ejemplo de entrada del usuario 1:**\n\n'En Lavalle 2212 se rompió un calefón.'\n\n**Ejemplo de entrada del usuario 2:**\n\n'Necesito reportar un problema en el edificio de Avenida de Mayo 560.  Hay una fuga de agua en el tercer piso.'\n\n**Ejemplo de entrada del usuario 3:**\n\n'Me encantaría saber más sobre los horarios de visita del Palacio Barolo, ubicado en Avenida de Mayo 1370.'\n\n\n**Tu proceso:**\n\n1. **Identifica y extrae la dirección:**  Localiza la parte del texto que corresponde a la dirección postal del edificio.  Asume que el texto siempre contendrá una dirección reconocible en español.\n2. **Extrae el texto restante:**  Identifica y extrae todo el texto del usuario que no corresponde a la dirección del edificio.\n3. **Formatea la salida:**  Presenta la información extraída en el siguiente formato:\n\nDirección: (dirección postal extraída)\nTexto: (texto del usuario sin la dirección)\n\n**Consideraciones adicionales:**\n\n*  Enfócate en la extracción precisa de la dirección y el texto. No es necesario interpretar la intención del usuario en este prompt simplificado, solo separar las dos partes del texto.\n*  Si la dirección no es claramente separable del resto del texto, intenta la mejor separación posible, priorizando la identificación de la dirección.\n*  Asume que siempre habrá al menos una parte del texto que se puede identificar como dirección, aunque pueda ser incompleta o ambigua.\"",
});

export async function chat(prompt: string, text: string) {
    const formatPrompt = prompt + `\n\nEl input del usuario es el siguiente: ` + text;
    const result = await model.generateContent(formatPrompt);
    const response = result.response;
    const timestamp = new Date().toLocaleString('es-ES');
    const answ = `[${timestamp}]\n${response.text()}`;
    return answ;
}

export async function image2text(prompt: string, imagePath: string): Promise<string> {
    // Resuelve la ruta de la imagen y lee el archivo.
    const resolvedPath = path.resolve(imagePath);
    const imageBuffer = fs.readFileSync(resolvedPath);

    // Convierte la imagen a base64 y configura la solicitud.
    const image = {
        inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: "image/png", // Cambia esto según el tipo de imagen, si es diferente.
        },
    };

    // Envía la solicitud a la API.
    const result = await model.generateContent([prompt, image]);

    // Devuelve el texto de la respuesta.
    return result.response.text();
}