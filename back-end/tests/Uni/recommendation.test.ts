import { jest } from "@jest/globals";

import { recommendationService } from "../../src/services/recommendationsService";
import { recommendationRepository } from "../../src/repositories/recommendationRepository";

import * as factory from "../factories/recommendationFactory"

jest.mock("../../src/repositories/recommendationRepository");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Create recommendation tests", () => {
    it("Should create a recommendation", async () => {
        jest.spyOn(recommendationRepository, "findByName").mockResolvedValueOnce(null);

        jest.spyOn(recommendationRepository, "create").mockImplementation(async () => {});

        const recommendationData = await factory.bodyFactory();

        await recommendationService.insert(recommendationData);

        expect(recommendationRepository.create).toHaveBeenCalledTimes(1);
    });

    it("Given a recommendation name that already exists, should not create a recommendation", async () => {
        const recommendationData = await factory.bodyFactory();

        jest.spyOn(recommendationRepository,"findByName").mockResolvedValueOnce({...recommendationData, id: 1, score:0});

        const promise = recommendationService.insert(recommendationData);

        expect(promise).rejects.toEqual({
            type: "conflict",
            message: "Recommendations names must be unique",
        });
        expect(recommendationRepository.create).not.toHaveBeenCalled();
    });
});

describe("Upvote recommendation tests", () => {
    it("Should update score", async () => {

        const recommendationData = await factory.bodyFactory();

        jest.spyOn(recommendationRepository, "find").mockResolvedValueOnce({...recommendationData, id: 1, score:0});

        jest.spyOn(recommendationRepository, "updateScore").mockImplementation(async () => {return {...recommendationData, id: 1, score:0}});

        await recommendationService.upvote(1);

        expect(recommendationRepository.updateScore).toHaveBeenCalledTimes(1);
    });

    it("Given a id that doesn't exist, should throw a not found error", async () => {
        jest.spyOn(recommendationRepository, "find").mockResolvedValueOnce(null);

        const promise = recommendationService.upvote(1);

        expect(promise).rejects.toEqual({ type: "not_found", message: "" });
        expect(recommendationRepository.updateScore).not.toHaveBeenCalled();
    });
});

describe("Downvote recommendation tests", () => {
    it("Should update score", async () => {

        const recommendationData = await factory.bodyFactory();

        jest.spyOn(recommendationRepository, "find").mockResolvedValue({...recommendationData, id: 1, score:0});

        jest.spyOn(recommendationRepository,"updateScore").mockResolvedValueOnce({...recommendationData, id: 1, score:1});

        jest.spyOn(recommendationRepository, "remove").mockImplementation(async () => {});

        await recommendationService.downvote(1);

        expect(recommendationRepository.updateScore).toHaveBeenCalledTimes(1);
        expect(recommendationRepository.remove).not.toHaveBeenCalled();
    });

    it("Given a score that is less than -5, should remove the recommendation", async () => {

        const recommendationData = await factory.bodyFactory();

        jest.spyOn(recommendationRepository,"updateScore").mockResolvedValueOnce({...recommendationData, id: 1, score:-6});

        await recommendationService.downvote(1);

        expect(recommendationRepository.updateScore).toHaveBeenCalledTimes(1);
        expect(recommendationRepository.remove).toHaveBeenCalledTimes(1);
    });

    it("Given an id that doesn't exist, should throw a not found error", async () => {
        jest.spyOn(recommendationRepository, "find").mockResolvedValueOnce(
            null
        );

        const promise = recommendationService.downvote(1);

        expect(promise).rejects.toEqual({ type: "not_found", message: "" });
        expect(recommendationRepository.updateScore).not.toHaveBeenCalled();
    });
});

describe("Get a random recommendation tests", () => {
    it("Should return a random recommendation with a score greater than 10 ", async () => {
        jest.spyOn(Math, "random").mockReturnValueOnce(0.6);

        const recommendationData1 = {...(await factory.bodyFactory()), id:1, score:0};
        const recommendationData2 = {...(await factory.bodyFactory()), id:2, score:0};

        recommendationData1.score = 11;
        recommendationData2.score = 5;

        jest.spyOn(recommendationRepository, "findAll").mockImplementationOnce(
            async (filter) => {
                const { score, scoreFilter } = filter;
                if (scoreFilter === "gt"){ return [recommendationData1] };
                if (scoreFilter === "lte"){ return [recommendationData2] };
            }
        );

        const response = await recommendationService.getRandom();

        expect(response).toEqual(recommendationData1);
        expect(recommendationRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("Should return a recommendation with a score less than 10", async () => {
        jest.spyOn(Math, "random").mockReturnValueOnce(0.8);

        const recommendationData1 = {...(await factory.bodyFactory()), id:1, score:0};
        const recommendationData2 = {...(await factory.bodyFactory()), id:2, score:0};

        recommendationData1.score = 11;
        recommendationData2.score = 5;

        jest.spyOn(recommendationRepository, "findAll").mockImplementationOnce(
            async (filter) => {
                const { score, scoreFilter } = filter;
                if (scoreFilter === "gt"){ return [recommendationData1] };
                if (scoreFilter === "lte"){ return [recommendationData2] };
            }
        );

        const response = await recommendationService.getRandom();

        expect(response).toEqual(recommendationData2);
        expect(recommendationRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("Should throw a not found error when there are no recommendations", () => {
        jest.spyOn(Math, "random").mockReturnValueOnce(0.6);
        jest.spyOn(recommendationRepository, "findAll").mockImplementationOnce(
            async () => []
        );

        const promise = recommendationService.getRandom();
        expect(promise).rejects.toEqual({ type: "not_found", message: "" });
    });
});

describe("Get recommendations tests", () => {
    it("Should return a list of recommendations", async () => {

        const recommendation = await factory.bodyFactory();

        jest.spyOn(recommendationRepository, "findAll").mockResolvedValueOnce([ {...recommendation, id: 1, score:0 } ]);

        const response = await recommendationService.get();

        expect(response).toEqual([recommendation]);
        expect(recommendationRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("Given a valid id, should return a recommendation", async () => {

        const recommendationData = {...(await factory.bodyFactory()), id:1, score:0};

        jest.spyOn(recommendationRepository, "find").mockResolvedValueOnce(recommendationData);

        const response = await recommendationService.getById(1);

        expect(response).toEqual(recommendationData);
        expect(recommendationRepository.find).toHaveBeenCalledTimes(1);
    })

    it("Given an id that doesn't exist, should return a not found error", async () => {
        jest.spyOn(recommendationRepository, "find").mockResolvedValueOnce(null);

        const promise = recommendationService.getById(1);
        expect(promise).rejects.toEqual({ type: "not_found", message: ""});
    })
});

describe("Get top amount recommendations tests", () => {
    it("Should return a list of amount recommendations", async () => {
        const recommendations = [];
        const amount = 6;
        for(let i = 0; i < amount; i++){
            const recommendationData = await factory.bodyFactory()
            recommendations.push(recommendationData);
        };

        jest.spyOn(recommendationRepository, "getAmountByScore").mockResolvedValueOnce(recommendations);

        const response = await recommendationService.getTop(amount);
        
        expect(response).toEqual(recommendations);
        expect(recommendationRepository.getAmountByScore).toHaveBeenCalledTimes(1);
    })
})