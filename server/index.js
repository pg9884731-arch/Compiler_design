const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Compiler Memory Visualizer Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Compile & Execute endpoint
app.post('/api/compile', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Source code is required.' });
  }

  const tempDir = os.tmpdir();
  const fileId = `cpp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const sourcePath = path.join(tempDir, `${fileId}.cpp`);
  const binaryPath = path.join(tempDir, `${fileId}.out`);

  try {
    // Write source file
    fs.writeFileSync(sourcePath, code, 'utf8');

    // Run g++ compilation
    exec(`g++ -O0 -g -fno-stack-protector "${sourcePath}" -o "${binaryPath}"`, (compileErr, stdout, stderr) => {
      if (compileErr) {
        // Clean up
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        return res.status(422).json({
          status: 'compile_error',
          error: stderr || compileErr.message
        });
      }

      // Execute compiled binary with a 3s safety timeout
      exec(`"${binaryPath}"`, { timeout: 3000 }, (runErr, runStdout, runStderr) => {
        // Clean up temp files
        try {
          if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
          if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
        } catch (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
        }

        if (runErr && runErr.killed) {
          return res.status(408).json({
            status: 'timeout',
            error: 'Execution timed out (infinite loop or deep recursion detected).'
          });
        }

        res.json({
          status: 'success',
          stdout: runStdout,
          stderr: runStderr,
          exitCode: runErr ? runErr.code : 0
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disassemble to x86_64 AT&T / Intel Assembly
app.post('/api/disassemble', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Source code is required.' });

  const tempDir = os.tmpdir();
  const fileId = `asm_${Date.now()}`;
  const sourcePath = path.join(tempDir, `${fileId}.cpp`);

  fs.writeFileSync(sourcePath, code, 'utf8');

  exec(`g++ -S -masm=intel -O0 "${sourcePath}" -o -`, (err, stdout, stderr) => {
    try {
      if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
    } catch (_) {}

    if (err) {
      return res.status(422).json({ error: stderr || err.message });
    }

    res.json({
      status: 'success',
      assembly: stdout
    });
  });
});

app.listen(PORT, () => {
  console.log(`Compiler Memory Visualizer Backend listening on port ${PORT}`);
});
