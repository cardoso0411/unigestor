// Rota que executa o script de backup manualmente quando o usuário confirma no dashboard.
import express from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, "../../Backup-do-sistema/backup-mysql.ps1");

let backupEmExecucao = false;

router.post("/run", async (req, res) => {
  if (backupEmExecucao) {
    return res.status(409).json({ error: "Ja existe um backup em execucao." });
  }

  backupEmExecucao = true;

  try {
    const { stdout, stderr } = await execFileAsync(
      "powershell.exe",
      ["-ExecutionPolicy", "Bypass", "-File", scriptPath],
      {
        cwd: path.resolve(__dirname, "../.."),
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 1024 * 1024
      }
    );

    return res.json({
      message: "Backup executado com sucesso!",
      output: (stdout || stderr || "").trim()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.stderr?.trim() || error.stdout?.trim() || error.message || "Falha ao executar backup."
    });
  } finally {
    backupEmExecucao = false;
  }
});

export default router;
