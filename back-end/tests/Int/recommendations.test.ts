import supertest from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database';
import { bodyFactory } from "../factories/recommendationFactory"
import {faker} from "@faker-js/faker";
import { Recommendation } from "@prisma/client"

beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "recommendations"`;
});

describe("POST recommendations test", () =>{
    it("POST /recommendations", async () => {

        const body = await bodyFactory();

        const result = await supertest(app).post("/recommendations").send(body);
        const insertedMusic = await prisma.recommendation.findFirst({
            where: {name: body.name}
        });

        delete insertedMusic.id
        delete insertedMusic.score

        expect(result.status).toBe(201);
        expect(insertedMusic).toStrictEqual(body);
    });

    it("POST /recommendations/:id/upvote", async () => {

        const body = await bodyFactory();

        const result = await supertest(app).post("/recommendations").send(body);

        const insertedMusic = await prisma.recommendation.findFirst({
            where: {name: body.name}
        });

        const upvote = await supertest(app).post(`/recommendations/${insertedMusic.id}/upvote`);

        const music = await prisma.recommendation.findFirst({
            where: { name: body.name }
        });

        expect(result.status).toBe(201);
        expect(insertedMusic).not.toBeNull();
        expect(upvote.status).toBe(200);
        expect(music.score).toBe(insertedMusic.score + 1);

    });

    it("POST /recommendations/:id/downvote", async () => {

        const body = await bodyFactory();

        const result = await supertest(app).post("/recommendations").send(body);

        const insertedMusic = await prisma.recommendation.findFirst({
            where: {name: body.name}
        });

        const downvote = await supertest(app).post(`/recommendations/${insertedMusic.id}/downvote`);

        const music = await prisma.recommendation.findFirst({
            where: { name: body.name }
        });

        expect(result.status).toBe(201);
        expect(insertedMusic).not.toBeNull();
        expect(downvote.status).toBe(200);
        expect(music.score).toBe(insertedMusic.score - 1);
    });
});

describe("/GET recommendations", () => {
    it("GET /recommendations", async () => {
        for( let i = 0; i<20; i++){
            await supertest(app).post("/recommendations").send(await bodyFactory());
        }

        const recommendations = await supertest(app).get("/recommendations");

        expect(recommendations.body).not.toBeNull();
        expect(recommendations.body.length).toBe(10);
    });
    
    it("GET /recommendations/:id", async () =>{
        const body = await bodyFactory();

        const result = await supertest(app).post("/recommendations").send(body);

        const insertedMusic = await prisma.recommendation.findFirst({
            where: {name: body.name}
        });

        const recommendation = await supertest(app).get(`/recommendations/${insertedMusic.id}`);

        expect(result.status).toBe(201);
        expect(insertedMusic).not.toBeNull();
        expect(recommendation.body).toStrictEqual(insertedMusic);
    });

    it("GET /recommendations/random", async () => {

        for(let i = 0; i<10; i++){
            await supertest(app).post("/recommendations").send(await bodyFactory());
        };

        const recommendation = await supertest(app).get(`/recommendations/random`);

        expect(recommendation.body).toBeInstanceOf(Object);
    });

    it("GET /recommendations/top/:amount", async () => {

        const amount = parseInt(faker.random.numeric(1))

        for(let i = 0; i<10; i++){
            await supertest(app).post("/recommendations").send(await bodyFactory());
        };

        const recommendations = await supertest(app).get(`/recommendations/top/${amount}`);

        expect(recommendations.body.length).toBe(amount);
    });
})

afterAll(async () => {
    await prisma.$disconnect();
});