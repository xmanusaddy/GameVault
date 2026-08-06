const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");

require("dotenv").config();

describe("GameVault - editar videojuego", function () {
    let driver;
    let gameName;

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

    async function typeSlowly(element, text) {
        for (const character of String(text)) {
            await element.sendKeys(character);
            await driver.sleep(45);
        }
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

        await typeSlowly(emailInput, TEST_EMAIL);
        await typeSlowly(passwordInput, TEST_PASSWORD);
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

    async function waitForToast(expectedText = "") {
        const toast = await driver.wait(
            until.elementLocated(By.id("toast-message")),
            10000
        );
        let matchedText = "";

        await driver.wait(async () => {
            const isVisible = await toast.isDisplayed();
            const text = await toast.getText();
            const normalizedText = text.toLowerCase();
            const matches = isVisible &&
                text.trim().length > 0 &&
                normalizedText.includes(expectedText.toLowerCase());

            if (matches) {
                matchedText = text;
            }

            return matches;
        }, 10000);

        return matchedText;
    }

    async function clearForm() {
        const fields = [
            "game-name",
            "game-genre",
            "game-platform",
            "game-developer",
            "game-year",
            "game-price"
        ];

        for (const id of fields) {
            const input = await driver.findElement(By.id(id));
            await input.clear();
        }
    }

    async function createGame() {
        gameName = `Update Game ${Date.now()}`;

        await clearForm();
        await typeSlowly(await driver.findElement(By.id("game-name")), gameName);
        await typeSlowly(await driver.findElement(By.id("game-genre")), "Aventura");
        await typeSlowly(await driver.findElement(By.id("game-platform")), "PC");
        await typeSlowly(await driver.findElement(By.id("game-developer")), "Update Studio");
        await typeSlowly(await driver.findElement(By.id("game-year")), "2024");
        await typeSlowly(await driver.findElement(By.id("game-price")), "29.99");

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        await waitForToast("creado");

        await driver.wait(async () => {
            const tableText = await driver.findElement(
                By.id("games-table-body")
            ).getText();

            return tableText.includes(gameName);
        }, 15000);
    }

    async function clickEditButton(name) {
        const row = await driver.wait(
            until.elementLocated(
                By.xpath(
                    `//tbody[@id="games-table-body"]/tr[td[1][normalize-space()="${name}"]]`
                )
            ),
            15000
        );

        const editButton = await row.findElement(
            By.css(".secondary-button")
        );

        await editButton.click();

        await driver.wait(async () => {
            const buttonText = await driver.findElement(
                By.css('#game-form button[type="submit"]')
            ).getText();

            return buttonText.trim() === "Guardar cambios";
        }, 10000);
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
        await createGame();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it("camino feliz: debe editar correctamente un videojuego", async function () {
        await clickEditButton(gameName);

        const nameInput = await driver.findElement(By.id("game-name"));
        const updatedName = `${gameName} Editado`;

        await nameInput.clear();
        await typeSlowly(nameInput, updatedName);

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const toastText = await waitForToast("actualizado");

        assert.ok(
            toastText.toLowerCase().includes("videojuego"),
            `Mensaje inesperado: ${toastText}`
        );

        await driver.wait(async () => {
            const tableText = await driver.findElement(
                By.id("games-table-body")
            ).getText();

            return tableText.includes(updatedName);
        }, 15000);

        const tableText = await driver.findElement(
            By.id("games-table-body")
        ).getText();

        assert.ok(
            tableText.includes(updatedName),
            "La tabla no mostró el nombre actualizado"
        );

        gameName = updatedName;

        await takeScreenshot("update-videojuego-exitoso.png");
    });

    it("prueba negativa: debe rechazar un precio negativo al editar", async function () {
        await clickEditButton(gameName);

        const priceInput = await driver.findElement(By.id("game-price"));

        await priceInput.clear();
        await typeSlowly(priceInput, "-5");

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const validPrice = await driver.executeScript(
            "return arguments[0].checkValidity();",
            priceInput
        );

        assert.strictEqual(
            validPrice,
            false,
            "La edición permitió guardar un precio negativo"
        );

        await takeScreenshot("update-precio-negativo.png");
    });

    it("prueba de límites: debe rechazar un año superior a 2100", async function () {
        await clickEditButton(gameName);

        const yearInput = await driver.findElement(By.id("game-year"));

        await yearInput.clear();
        await typeSlowly(yearInput, "2101");

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const validYear = await driver.executeScript(
            "return arguments[0].checkValidity();",
            yearInput
        );

        assert.strictEqual(
            validYear,
            false,
            "La edición permitió guardar un año superior a 2100"
        );

        await takeScreenshot("update-anio-fuera-de-limite.png");
    });
});
