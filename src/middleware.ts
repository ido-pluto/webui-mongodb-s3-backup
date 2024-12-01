import astroForms from "@astro-utils/forms";
import { sequence } from "astro/middleware";
import { randomUUID } from "crypto";

export const onRequest = sequence(astroForms({
    secret: process.env.WEBSITE_SECRET || randomUUID(),
    session: {
        cookieName: 'session',
        cookieOptions: {
            maxAge: 60 * 60 * 24 * 7 * 30 * 3,
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            path: '/',
        }
    },
    logs: null
}));