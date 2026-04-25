import express from "express";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import path, { join, basename, resolve, extname } from "path";
import Handlebars from "handlebars";

const router = express.Router({ mergeParams: true });

const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;

function safeFilePath(baseDir, filename) {
    const basePath = resolve(baseDir);
    const safeName = basename(String(filename));
    const targetPath = resolve(basePath, safeName);

    if (!targetPath.startsWith(basePath + path.sep)) {
        throw new Error("Invalid path");
    }

    return targetPath;
}

function safeDirectoryPath(baseDir, directory) {
    const basePath = resolve(baseDir);
    const targetPath = resolve(basePath, String(directory));

    if (targetPath !== basePath && !targetPath.startsWith(basePath + path.sep)) {
        throw new Error("Invalid directory");
    }

    return targetPath;
}

router.get("/", async (req, res) => {
   
    try {
        const quarterlySalesDistribution = {
            Q1: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
            Q2: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
            Q3: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
        };

        const budgetVsActual = {
            January: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
            
            June: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
        };

        const timePlot = {
            projected: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
            actual: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
            historicalAvg: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
        };

        return res.json({ success: true, quarterlySalesDistribution, budgetVsActual, timePlot });
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong." });
    }
});

router.get("/download-report", (req, res) => {
    try {
        const { reportName } = req.query;

        if (!reportName || typeof reportName !== "string") {
            return res.status(400).json({ message: "Report name required" });
        }

        const safeReportName = basename(reportName);
        const reportPath = safeFilePath("./reports", safeReportName);

        if (existsSync(reportPath)) {
            const content = readFileSync(reportPath);
            res.setHeader("Content-Disposition", `attachment; filename="${safeReportName}"`);
            return res.send(content);
        }

        return res.status(404).json({ message: "Report not found" });
    } catch (error) {
        return res.status(500).json({ message: "Download failed" });
    }
});

router.get("/render-page", (req, res) => {
    try {
        const { template } = req.query;

        if (!template || typeof template !== "string") {
            return res.status(400).json({ message: "Template name required" });
        }

        const safeTemplateName = basename(template);

        if (!safeTemplateName.endsWith(".hbs")) {
            return res.status(400).json({ message: "Only .hbs templates allowed" });
        }

        const templatePath = safeFilePath("./templates", safeTemplateName);

        if (existsSync(templatePath)) {
            const templateContent = readFileSync(templatePath, "utf8");
            const compiled = Handlebars.compile(templateContent);
            return res.send(compiled({}));
        }

        return res.status(404).json({ message: "Template not found" });
    } catch (error) {
        return res.status(500).json({ message: "Template rendering failed" });
    }
});

router.post("/upload-file", (req, res) => {
    try {
       
        const { filename, content } = req.body; 

        if (!filename || typeof filename !== "string" || typeof content !== "string") {
            return res.status(400).json({ message: "Filename and content required" });
        }

        if (content.length > 100000) {
            return res.status(400).json({ message: "File content too large" });
        }

        const safeFilename = basename(filename);
        const extension = extname(safeFilename).toLowerCase();
        const allowedExtensions = [".txt", ".csv", ".json"];

        if (!allowedExtensions.includes(extension)) {
            return res.status(400).json({ message: "File type not allowed" });
        }

        const uploadPath = safeFilePath("./uploads", safeFilename);

        if (existsSync(uploadPath)) {
            return res.status(409).json({ message: "File already exists" });
        }

        writeFileSync(uploadPath, content, { flag: "wx" });

        return res.json({ 
            success: true, 
            filename: safeFilename,
            message: "File uploaded successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: "Upload failed" });
    }
});

router.get("/export-csv", (req, res) => {
    try {
        const { dataFile } = req.query;

        if (!dataFile || typeof dataFile !== "string") {
            return res.status(400).json({ message: "Data file required" });
        }

        const safeDataFile = basename(dataFile);

        if (!safeDataFile.endsWith(".csv")) {
            return res.status(400).json({ message: "Only CSV files allowed" });
        }

        const csvPath = safeFilePath("./data", safeDataFile);

        if (existsSync(csvPath)) {
            const csvData = readFileSync(csvPath, "utf8");

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="${safeDataFile}"`);
            return res.send(csvData);
        }

        return res.status(404).json({ message: "CSV file not found" });
    } catch (error) {
        return res.status(500).json({ message: "Export failed" });
    }
});

router.get("/browse-files", (req, res) => {
    try {
        const { directory } = req.query;

        if (!directory || typeof directory !== "string") {
            return res.status(400).json({ message: "Directory required" });
        }

        const requestedDirPath = safeDirectoryPath("./files", directory);

        if (existsSync(requestedDirPath)) {
            const stats = statSync(requestedDirPath);

            if (!stats.isDirectory()) {
                return res.status(400).json({ message: "Requested path is not a directory" });
            }

            const files = readdirSync(requestedDirPath);

            const fileList = files.map(file => {
                const filePath = join(requestedDirPath, file);
                const stats = statSync(filePath);

                return {
                    name: file,
                    size: stats.size,
                    isDirectory: stats.isDirectory(),
                    modified: stats.mtime
                };
            });

            return res.json({ success: true, files: fileList });
        }

        return res.status(404).json({ message: "Directory not found" });
    } catch (error) {
        return res.status(500).json({ message: "Could not list directory" });
    }
});

router.get("/config/load", (req, res) => {
    try {
        const { configFile } = req.query;

        if (!configFile || typeof configFile !== "string") {
            return res.status(400).json({ message: "Config file required" });
        }

        const safeConfigFile = basename(configFile);

        if (!safeConfigFile.endsWith(".json")) {
            return res.status(400).json({ message: "Only JSON config files allowed" });
        }

        const configPath = safeFilePath("./config", safeConfigFile);

        if (existsSync(configPath)) {
            const config = readFileSync(configPath, "utf8");
            return res.json({ success: true, config: JSON.parse(config) });
        }

        return res.status(404).json({ message: "Config file not found" });
    } catch (error) {
        return res.status(500).json({ message: "Could not load config" });
    }
});

router.post("/generate-custom-report", (req, res) => {
    try {
        const { templateName, data } = req.body;

        if (!templateName || typeof templateName !== "string") {
            return res.status(400).json({ message: "Template name required" });
        }

        const safeTemplateName = basename(templateName);

        if (!safeTemplateName.endsWith(".hbs")) {
            return res.status(400).json({ message: "Only .hbs templates allowed" });
        }

        const templatePath = safeFilePath("./templates", safeTemplateName);

        if (!existsSync(templatePath)) {
            return res.status(404).json({ message: "Template not found" });
        }

        const reportData = data && typeof data === "object" && !Array.isArray(data)
            ? data
            : {
                username: "Unknown",
                date: new Date().toLocaleDateString(),
                totalUsers: 100
            };

        const templateContent = readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(templateContent);
        const report = template(reportData);

        return res.json({
            success: true,
            report,
            generatedAt: new Date()
        });
    } catch (error) {
        return res.status(500).json({ message: "Report generation failed" });
    }
});

export default router;