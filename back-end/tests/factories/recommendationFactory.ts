import {faker} from "@faker-js/faker";

export async function bodyFactory(){
    const body = {
        name: faker.lorem.word(),
        youtubeLink: `www.youtube.com/${faker.random.alpha({ count: 10 })}`
    };

    return body
}
