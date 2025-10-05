const dotenv = require("dotenv").config();
const { askAya } = require("..//config/ai");
const app = require("../app");
const request = require("supertest");

describe("unit test", () => {
  it("passing test", async () => {
    const res = await askAya({
      text: "What should I expect today?",
      dayData: {
        dayIndex: 120,
        babyUpdate: "Baby can hear sounds",
        momUpdate: "You might feel more energetic today",
        tips: "Stay hydrated and rest well",
      },
    });
    // console.log({ result: res.content });
    expect(res.content).toBeDefined();
  });

  it("should make quest susscessfully", async () => {
    console.log("make request succesfully");
  });
});
