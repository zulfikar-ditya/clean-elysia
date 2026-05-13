import { enterLocale, parseAcceptLanguage } from "@i18n";
import { Elysia } from "elysia";

export const LocalePlugin = new Elysia({ name: "locale" }).onRequest(
	({ request }) => {
		const locale = parseAcceptLanguage(request.headers.get("accept-language"));
		enterLocale(locale);
	},
);
