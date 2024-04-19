import {describe, expect, test} from "bun:test";
import {handleHealthEndpoints} from "@/routes/health.ts";

describe("health-endpoints", () => {
    test("invalid", () => {
        expect(handleHealthEndpoints("/health/invalid")?.status).toBe(404)
    })

    test("readiness", () => {
        expect(handleHealthEndpoints("/health/readiness")?.status).toBe(200)
    })

    test("liveness", () => {
        expect(handleHealthEndpoints("/health/liveness")?.status).toBe(200)
    })
})