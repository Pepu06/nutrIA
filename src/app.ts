import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MongoAdapter as Database } from '@builderbot/database-mongo'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { image2text } from './gemini'
import "dotenv/config";

const PORT = process.env.PORT ?? 3008
const MONGO_DB_URI = process.env.MONGO_DB_URI ?? 'mongodb://localhost:27017/nutria'

const welcomeFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola'])
    .addAnswer(`🙌 Hello welcome to this *Chatbot*`)

const imageFlow = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, ctxFn) => {
        console.log("Recibi una imagen")
        const localPath = await ctxFn.provider.saveFile(ctx, { path: './public' })

        const response = await image2text("Describir detalladamente que es lo que ves en esta imagen y luego detallar los macronutrientes, calorias y receta, respondeme en argentino", localPath)
        await ctxFn.flowDynamic(response)
    })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, imageFlow])
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.jwtToken,
        numberId: process.env.numberId,
        verifyToken: process.env.verifyToken,
        version: process.env.version
    })
    const adapterDB = new Database({
        dbUri: MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME ?? 'nutria'
    })

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