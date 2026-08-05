const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");

require("dotenv").config();

describe("GameVault - consultar videojuegos", function () {
    let driver;

    const APP_URL = "http://localhost:5000";
    const TEST_EMAIL = process.env.TEST_USER_EMAIL;
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

    this.timeout(120000);

    async function takeScreenshot(fileName) {
        const screenshotsDir = path.join(__dirname, "..", "screenshots");

        fs.mkdirSync(screenshotsDir, { recursive: true });

        const screenshot = await driver.takeScreenshot();

        fs.writeFileSync(
            path.join(screenshotsDir, fileName),
            screenshot,
            "base64"
        );
    }

    async function login() {
        await driver.get(APP_URL);

        const emailInput = await driver.wait(
            until.elementLocated(By.css('[data-testid="email-input"]')),
            10000
        );

        const passwordInput = await driver.findElement(
            By.css('[data-testid="password-input"]')
        );

        const loginButton = await driver.findElement(
            By.css('[data-testid="login-button"]')
        );

        await emailInput.sendKeys(TEST_EMAIL);
        await passwordInput.sendKeys(TEST_PASSWORD);
        await loginButton.click();

        const authenticatedView = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="authenticated-view"]')
            ),
            15000
        );

        await driver.wait(
            until.elementIsVisible(authenticatedView),
            10000
        );
    }

    before(async function () {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            throw new Error("Faltan las credenciales de prueba en el archivo .env");
        }

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.manage().window().maximize();

        await login();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it("camino feliz: debe mostrar la lista de videojuegos registrados", async function () {
        const tableBody = await driver.wait(
            until.elementLocated(By.id("games-table-body")),
            10000
        );

        await driver.wait(async () => {
            const text = await tableBody.getText();
            return text.trim().length > 0;
        }, 15000);

        const tableText = await tableBody.getText();

        assert.ok(
            tableText.trim().length > 0,
            "La tabla no mostró ningún contenido"
        );

        await takeScreenshot("read-lista-videojuegos.png");
    });

    it("prueba negativa: debe mostrar un mensaje válido si no hay registros visibles", async function () {
        const tableBody = await driver.findElement(
            By.id("games-table-body")
        );

        const tableText = await tableBody.getText();

        const hasGames = tableText.trim().length > 0 &&
            !tableText.includes("No hay videojuegos registrados.");

        const hasEmptyMessage = tableText.includes(
            "No hay videojuegos registrados."
        );

        assert.ok(
            hasGames || hasEmptyMessage,
            "La tabla no mostró videojuegos ni un mensaje de estado vacío"
        );

        await takeScreenshot("read-estado-tabla.png");
    });

    it("prueba de límites: debe conservar la estructura de siete columnas", async function () {
        const headers = await driver.findElements(
            By.css(".table-section thead th")
        );

        assert.strictEqual(
            headers.length,
            7,
            `Se esperaban 7 columnas, pero se encontraron ${headers.length}`
        );

        const headerTexts = [];

        for (const header of headers) {
            headerTexts.push(
                (await header.getText()).trim().toLowerCase()
            );
        }

        assert.deepStrictEqual(
            headerTexts,
            [
                "título",
                "género",
                "plataforma",
                "desarrollador",
                "año de lanzamiento",
                "precio",
                "acciones"
            ]
        );

        await takeScreenshot("read-estructura-tabla.png");
    });
});