const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

(async () => {
  try {
    // Verifica se os binários do Playwright estão instalados
    console.log("Verificando instalação dos binários do Playwright...");
    execSync("npx playwright install", { stdio: "inherit" });

    // Verifica e instala as dependências do sistema, se necessário
    console.log("Verificando dependências do sistema...");
    try {
      execSync("npx playwright install-deps", { stdio: "inherit" });
    } catch (error) {
      console.warn(`
        A instalação automática de dependências falhou.
        Para instalar as dependências manualmente, execute o seguinte comando:
        
        sudo apt-get install libnss3 libnspr4 libasound2
      `);
    }

    // Inicializa o navegador e abre uma nova página
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // URL do Mattermost
    const url = "http://localhost:8065";
    await page.goto(url);

    // Analisa a acessibilidade da página usando o Axe
    const results = await new AxeBuilder({ page }).analyze();

    // Define o diretório de relatórios (mesmo nível que /scripts)
    const reportDir = path.resolve(__dirname, "../reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Salva o relatório em um arquivo JSON
    const reportPath = path.join(reportDir, "accessibility-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(`Accessibility report generated at ${reportPath}`);
    await browser.close();
  } catch (error) {
    console.error("Accessibility analysis failed:", error);
    process.exit(1);
  }
})();