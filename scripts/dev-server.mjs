import net from "node:net";
import { spawn } from "node:child_process";

const PORT = 8000;
const HOST = "0.0.0.0";

function canListen(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

try {
  const free = await canListen(PORT, HOST);

  if (!free) {
    console.log(`Port ${PORT} ist bereits belegt.`);
    console.log(`Wenn das dein buildIT-Server ist, oeffne einfach http://localhost:${PORT}`);
    console.log("Falls nicht, stoppe den Prozess auf Port 8000 und starte den Befehl erneut.");
    process.exit(0);
  }

  const child = spawn("python3", ["-m", "http.server", String(PORT)], {
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
} catch (error) {
  console.error("Dev-Server konnte nicht gestartet werden.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
