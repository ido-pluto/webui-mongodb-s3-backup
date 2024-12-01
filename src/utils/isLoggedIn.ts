import type { AstroGlobal } from "astro";
import { WEBSITE_PASSWORD } from "../config.ts";

export function isLoggedIn(astro: AstroGlobal): boolean {
    return astro.locals.session.password === WEBSITE_PASSWORD;
}