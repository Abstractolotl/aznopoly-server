import {describe, expect, test} from "bun:test";
import {handleHealthEndpoints} from "@/routes/health.ts";

describe("health-endpoints", () => {
    test("invalid", () => {
        expect(handleHealthEndpoints(["bla", "health", "invalid"])?.status).toBe(404)
    })

    test("readiness", () => {
        expect(handleHealthEndpoints(["bla", "health", "readiness"])?.status).toBe(200)
    })

    test("liveness", () => {
        expect(handleHealthEndpoints(["bla", "health", "liveness"])?.status).toBe(200)
    })
})