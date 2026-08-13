import { describe, expect, it } from "vitest";
import apiRoutes from "~/utils/api-routes";

describe("api_routes", () => {
  it("builds article routes with encoded search params", () => {
    expect(apiRoutes.articles.list).toBe("/article");
    expect(apiRoutes.articles.view("first-post")).toBe(
      "/article/article/first-post",
    );
    expect(apiRoutes.articles.search("nwed nyin", 5, 20)).toBe(
      "/article/search?term=nwed%20nyin&skip=5&take=20",
    );
  });

  it("builds dictionary routes", () => {
    expect(apiRoutes.dictionary.list).toBe("/dictionary");
    expect(apiRoutes.dictionary.view("ụlọ")).toBe("/dictionary/ụlọ");
    expect(apiRoutes.dictionary.viewById("word-id")).toBe(
      "/dictionary/id/word-id",
    );
    expect(apiRoutes.dictionary.updateSound("word-id")).toBe(
      "/file/upload-sound/word-id",
    );
    expect(apiRoutes.dictionary.search("place where people live")).toBe(
      "/dictionary/search?term=place%20where%20people%20live",
    );
  });

  it("exposes auth and file routes", () => {
    expect(apiRoutes.auth.login).toBe("/auth/login");
    expect(apiRoutes.auth.register).toBe("/auth/register");
    expect(apiRoutes.auth.refresh).toBe("/auth/refresh");
    expect(apiRoutes.auth.profile).toBe("/auth/profile");
    expect(apiRoutes.files.download("cover.png")).toBe(
      "/file/download/cover.png",
    );
  });
});
