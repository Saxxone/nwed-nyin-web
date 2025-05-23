// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: { enabled: true },
  devServer: {
    port: 4000,
    https: {
      key: "./example.com+5-key.pem",
      cert: "./example.com+5.pem",
    },
  },
  $production: {
    // Production-specific config
    app: {
      head: {
        title: "Ñwed Nnyịn (Nwed Nyin)",
        meta: [
          { charset: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { name: "description", content: "Nwed Nyin" },
          {
            content: "same-origin-allow-popups",
            "http-equiv": "Cross-Origin-Opener-Policy",
          },
        ],
        script: [
          {
            async: true,
            src: "https://www.googletagmanager.com/gtag/js?id=G-ZMKY8C7KWE",
          },
          {
            hid: "gtag",
            innerHTML: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZMKY8C7KWE');
            `,
            type: "text/javascript",
          },
        ],
        link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
      },
    },
  },
  css: ["~/assets/css/components.css"],
  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
});
