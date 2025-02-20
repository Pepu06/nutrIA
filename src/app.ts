import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { image2text, chat } from './gemini'
import "dotenv/config";
import fs from 'fs'

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(['hola', 'buenas', 'ey', 'qué tal', 'saludos'])
    .addAnswer(`¡Holaaaa! 👋 ¡Soy tu asistente de nutrición amigable! 😊 Estoy aquí para ayudarte a comer de forma más saludable y deliciosa. 🍎🥦

¿Cómo puedo ayudarte hoy?

Si me envías una foto de tu plato: 📸

¡Analizaré tu comida como un experto! 🧐 Te diré los macronutrientes (proteínas, carbohidratos, grasas) y las calorías que tiene. 📊
¡Y no solo eso! 🤩 Te daré una receta súper detallada para que puedas preparar ese plato en casa, ¡paso a paso! 📝
Si me pides una receta por escrito: ✍️

¡No hay problema! Dime qué se te antoja comer hoy y te daré una receta detallada y deliciosa. 😋 Te diré los ingredientes exactos, cómo prepararlo y hasta consejos de cocina. 👨‍🍳
Mi objetivo es hacer que comer sano sea fácil y divertido para ti.  🎉  ¡Pregúntame lo que quieras!  Estoy aquí para apoyarte en tu camino hacia una vida más saludable. 💪`)

const imageFlow = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, ctxFn) => {
        console.log("Recibi una imagen")
        const localPath = await ctxFn.provider.saveFile(ctx, { path: './assets' })
        const response = await image2text(localPath)
        await ctxFn.flowDynamic(response)
        // Clean up the saved image file
        await fs.promises.unlink(localPath)
    })

const textFlow = addKeyword<Provider, Database>(['foto', 'imagen', 'plato', 'comida', 'almuerzo', 'cena', 'desayuno', 'esto', 'mira', 've', 'qué es esto', 'analiza', 'nutrición', 'calorías', 'macros', 'información', 'datos', 'valor nutricional', 'ingredientes', 'receta', 'receta', 'quiero receta', 'dame receta', 'recetas', 'cocinar', 'comer', 'de', 'con', 'antojo', 'sugerencia', 'idea', 'más', 'otra cosa', 'ayuda', 'sugerencia', 'idea', 'mañana', 'próximo', 'desayuno', 'almuerzo', 'cena', 'algo más', 'vegetariano', 'vegano', 'sin gluten', 'rápido', 'fácil', 'dulce', 'salado', 'picante', 'ligero', 'completo'])
    .addAction(async (ctx, ctxFn) => {
        const userMessage = ctx.body;
        const response = await chat(userMessage);
        await ctxFn.flowDynamic(response);
    })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, imageFlow, textFlow])
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.jwtToken,
        numberId: process.env.numberId,
        verifyToken: process.env.verifyToken,
        version: 'v21.0'
    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()