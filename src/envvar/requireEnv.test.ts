import { afterEach, describe, expect, it } from "vite-plus/test"
import { requireEnv } from "./requireEnv"

describe("requireEnv", () => {
  const key = "TEST_REQUIRE_ENV_KEY"

  afterEach(() => {
    delete process.env[key]
  })

  it("環境変数が設定されている場合はその値を返す", () => {
    process.env[key] = "hello"
    expect(requireEnv(key)).toBe("hello")
  })

  it("環境変数が未設定の場合は throw する", () => {
    expect(() => requireEnv(key)).toThrow(
      "Missing required environment variable: TEST_REQUIRE_ENV_KEY",
    )
  })

  it("環境変数が空文字の場合は throw する", () => {
    process.env[key] = ""
    expect(() => requireEnv(key)).toThrow()
  })
})
