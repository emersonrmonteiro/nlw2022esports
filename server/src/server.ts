import express from "express";
import cors from 'cors'

import { PrismaClient } from "@prisma/client";
import { convertHoursStringToMinutes } from "./utils/convert-hours-string-to-minutes";
import { convertMinutesToHoursString } from "./utils/convert-minutes-to-hours-string";

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
	log: ['query']
})

app.get('/games', async (request, response) => {
	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true,
				}
			}
		}
	})

	return response.json(games);
})

app.post('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;
	const body: any = request.body;

	// Validação (zod)

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearPlaying: body.yearPlaying,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			hourStart: convertHoursStringToMinutes(body.hourStart),
			hourEnd: convertHoursStringToMinutes(body.hourEnd),
			useVoiceChannel: body.useVoiceChannel,
		}
	})

	return response.status(201).json(ad);
})


app.get('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			yearPlaying: true,
			useVoiceChannel: true,
			hourStart: true,
			hourEnd: true,
		},
		where: {
			gameId
		}
	})

	return response.status(201).json(ads.map(ad => {
		return {
			...ad,
			weekDays: ad.weekDays.split(','),
			hourStart: convertMinutesToHoursString(ad.hourStart),
			hourEnd: convertMinutesToHoursString(ad.hourEnd)
		}
	}));
})

app.get('/ads', (request, response) => {
	return response.json([
		{ id: 1, name: "Anuncio 1" },
		{ id: 2, name: "Anuncio 2" },
		{ id: 3, name: "Anuncio 3" },
		{ id: 4, name: "Anuncio 4" },
	])
})

app.get('/ads/:id/discord', async (request, response) => {
	const adId = request.params.id;
	const ad = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true
		},
		where: {
			id: adId,
		}
	})
	return response.status(201).json({
		discord: ad.discord
	});
})

app.listen(3333)