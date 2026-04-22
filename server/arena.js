#!/usr/bin/env node
/**
 * Subagent Arena - UI Competition Framework
 * 
 * Usage:
 *   node arena.js "Build a responsive dashboard for monitoring Docker containers"
 * 
 * Flow:
 * 1. Spawns N subagent competitors (parallel)
 * 2. Each generates a complete UI implementation
 * 3. Automated judging on: UX, code quality, aesthetics, responsiveness
 * 4. Ranks all entries, selects top 3
 * 5. Serves top 3 on local web server + Tailscale URL
 * 6. Opens comparison interface for human to pick winner
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ARENA_DIR = path.join(__dirname, 'arena');
const ENTRIES_DIR = path.join(ARENA_DIR, 'entries');
const RESULTS_FILE = path.join(ARENA_DIR, 'results.json');

// Configuration
const NUM_COMPETITORS = 5;
const PORT = 8765;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getTailscaleIP() {
  try {
    const ips = execSync('tailscale ip -4', { encoding: 'utf8' }).trim().split('\n');
    return ips[0];
  } catch {
    return null;
  }
}

function spawnCompetitor(id, prompt) {
  const competitorDir = path.join(ENTRIES_DIR, `competitor-${id}`);
  ensureDir(competitorDir);
  
  // Write the subagent prompt
  const systemPrompt = `You are Competitor #${id} in a UI coding competition. 

TASK: ${prompt}

RULES:
- Create the BEST possible UI implementation
- Use vanilla HTML/CSS/JS (single file index.html preferred, or separate files)
- Focus on: user experience, visual design, responsiveness, and code quality
- Include interactive elements and polish
- You are competing against ${NUM_COMPETITORS - 1} other AI agents

OUTPUT: Write your complete implementation to the directory: ${competitorDir}
- Create index.html as the entry point
- You may create additional CSS/JS files if needed
- Add a brief README.md explaining your design decisions

Make it WIN-worthy!`;

  fs.writeFileSync(path.join(competitorDir, '.prompt.md'), systemPrompt);
  
  console.log(`[Arena] Competitor #${id} spawned`);
  return competitorDir;
}

function judgeEntry(competitorDir) {
  // Automated judging based on file analysis
  const files = fs.readdirSync(competitorDir);
  const indexHtml = files.includes('index.html');
  
  let htmlContent = '';
  if (indexHtml) {
    htmlContent = fs.readFileSync(path.join(competitorDir, 'index.html'), 'utf8');
  }
  
  // Scoring heuristics
  let score = 0;
  
  // Has entry point
  if (indexHtml) score += 20;
  
  // File count (more files = more complex, but single-file is fine too)
  score += Math.min(files.length * 2, 10);
  
  // HTML size (substantial content)
  score += Math.min(htmlContent.length / 100, 20);
  
  // Checks for responsive design
  if (htmlContent.includes('media') || htmlContent.includes('flex') || htmlContent.includes('grid')) score += 15;
  
  // Checks for interactivity
  if (htmlContent.includes('script') || htmlContent.includes('onclick') || files.some(f => f.endsWith('.js'))) score += 15;
  
  // Checks for styling
  if (htmlContent.includes('style') || files.some(f => f.endsWith('.css'))) score += 10;
  
  // Has README
  if (files.includes('README.md')) score += 10;
  
  return { dir: competitorDir, score: Math.round(score), files, hasEntry: indexHtml };
}

function runCompetition(prompt) {
  console.log('\n🏆 SUBAGENT ARENA 🏆');
  console.log('====================\n');
  console.log(`Task: ${prompt}\n`);
  
  ensureDir(ARENA_DIR);
  ensureDir(ENTRIES_DIR);
  
  // Phase 1: Spawn competitors
  console.log(`[Phase 1] Spawning ${NUM_COMPETITORS} competitors...\n`);
  const competitors = [];
  for (let i = 1; i <= NUM_COMPETITORS; i++) {
    competitors.push(spawnCompetitor(i, prompt));
  }
  
  // Phase 2: In a real implementation, we'd use the Task tool to spawn subagents
  // For now, create placeholder entries to demonstrate the flow
  console.log('[Phase 2] Competitors are coding... (simulated)\n');
  
  // Simulate that subagents have written their entries
  // In practice, you'd use the Task tool to actually run the LLMs
  
  // Phase 3: Judge entries
  console.log('[Phase 3] Judging entries...\n');
  const results = competitors.map(dir => judgeEntry(dir));
  results.sort((a, b) => b.score - a.score);
  
  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  
  // Phase 4: Select top 3
  const top3 = results.slice(0, 3);
  console.log('📊 RESULTS:');
  console.log('-----------');
  results.forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`${medal} #${i + 1}: ${path.basename(r.dir)} - Score: ${r.score}/100`);
  });
  
  console.log('\n✨ TOP 3 SELECTED ✨\n');
  
  return top3;
}

function createReviewInterface(top3) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏆 Subagent Arena - Final Review</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: white;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            text-align: center;
            color: rgba(255,255,255,0.9);
            margin-bottom: 40px;
            font-size: 1.1rem;
        }
        .competitors {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        .competitor {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .competitor:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        .competitor-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .competitor-name {
            font-size: 1.3rem;
            font-weight: bold;
        }
        .medal {
            font-size: 2rem;
        }
        .competitor-preview {
            height: 300px;
            border: none;
            width: 100%;
            background: #f5f5f5;
        }
        .competitor-actions {
            padding: 20px;
            display: flex;
            gap: 10px;
        }
        .btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            text-align: center;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .winner-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .winner-section h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .vote-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .vote-btn {
            padding: 15px 40px;
            font-size: 1.2rem;
            border: 3px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
        }
        .vote-btn:hover {
            transform: scale(1.1);
        }
        .vote-1 { background: gold; color: #333; }
        .vote-2 { background: silver; color: #333; }
        .vote-3 { background: #cd7f32; color: white; }
        .vote-btn.selected {
            border-color: #333;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        #winner-display {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            font-size: 1.5rem;
            display: none;
        }
        .tailscale-info {
            text-align: center;
            color: rgba(255,255,255,0.8);
            margin-top: 20px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏆 Subagent Arena</h1>
        <p class="subtitle">Top 3 AI-generated UIs. Review and pick your winner!</p>
        
        <div class="competitors">
            ${top3.map((entry, i) => {
              const name = path.basename(entry.dir);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
              const rank = i + 1;
              return `
            <div class="competitor">
                <div class="competitor-header">
                    <span class="competitor-name">${name}</span>
                    <span class="medal">${medal}</span>
                </div>
                <iframe class="competitor-preview" src="/entries/${name}/index.html" sandbox="allow-scripts"></iframe>
                <div class="competitor-actions">
                    <a href="/entries/${name}/index.html" target="_blank" class="btn btn-primary">Open Full View</a>
                    <a href="/entries/${name}/README.md" target="_blank" class="btn btn-secondary">View README</a>
                </div>
            </div>`;
            }).join('')}
        </div>
        
        <div class="winner-section">
            <h2>🎯 Cast Your Vote</h2>
            <p style="margin-bottom: 20px; color: #666;">Click to select the winner. The chosen UI will be crowned champion!</p>
            <div class="vote-buttons">
                ${top3.map((entry, i) => {
                  const name = path.basename(entry.dir);
                  return `<button class="vote-btn vote-${i+1}" onclick="selectWinner(${i+1}, '${name}')">${i+1}. ${name}</button>`;
                }).join('')}
            </div>
            <div id="winner-display"></div>
        </div>
        
        <div class="tailscale-info">
            <p>🔗 Access this arena from any device on your tailnet</p>
        </div>
    </div>
    
    <script>
        function selectWinner(rank, name) {
            // Remove previous selections
            document.querySelectorAll('.vote-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Highlight selected
            document.querySelector('.vote-' + rank).classList.add('selected');
            
            // Show winner
            const display = document.getElementById('winner-display');
            display.style.display = 'block';
            display.innerHTML = '🎉 Winner Selected: <strong>' + name + '</strong>! 🎉';
            
            // You could send this to a server, save to file, etc.
            console.log('Winner selected:', name);
            
            // Optional: announce winner
            setTimeout(() => {
                alert('🏆 ' + name + ' is the champion!');
            }, 500);
        }
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(ARENA_DIR, 'index.html'), html);
}

function startServer(top3) {
  createReviewInterface(top3);
  
  const server = http.createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(ARENA_DIR, url);
    
    // Security: only serve files within ARENA_DIR
    if (!filePath.startsWith(ARENA_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.md': 'text/markdown',
      }[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n🌐 ARENA SERVER STARTED');
    console.log('========================');
    console.log(`Local:   http://localhost:${PORT}`);
    
    const tsIP = getTailscaleIP();
    if (tsIP) {
      console.log(`Tailscale: http://${tsIP}:${PORT}`);
      console.log('\n💡 To use a custom domain, run:');
      console.log(`   tailscale serve --bg --set-path /arena http://localhost:${PORT}`);
    } else {
      console.log('\n⚠️  Tailscale not detected. Install it for secure remote access.');
    }
    
    console.log('\n📱 Open the URL above to review and vote!\n');
  });
  
  return server;
}

// Main execution
const prompt = process.argv[2] || 'Create a beautiful, responsive landing page for a SaaS product';
const top3 = runCompetition(prompt);
startServer(top3);

console.log('\n✅ Arena is ready! Waiting for subagent entries...');
console.log('   (In the full implementation, subagents would write to the entries directory)\n');
