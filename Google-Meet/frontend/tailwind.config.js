/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e8f4fd',
                    100: '#d0e9fb',
                    200: '#a1d3f7',
                    300: '#72bdf3',
                    400: '#43a7ef',
                    500: '#1a73e8', // Google Meet blue
                    600: '#155eba',
                    700: '#10478b',
                    800: '#0a2f5d',
                    900: '#05182e',
                },
                dark: {
                    100: '#3c4043',
                    200: '#303134',
                    300: '#292a2d',
                    400: '#202124',
                    500: '#1a1b1e',
                },
            },
            fontFamily: {
                sans: ['Roboto', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
