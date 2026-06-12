import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { load } from "cheerio";

function computeStatus(deadline: string): string {
  if (!deadline || deadline === '상시') return '접수중';
  const now = new Date();
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return '접수중';
  if (d < now) return '마감';
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);
  return d <= soon ? '접수마감임박' : '접수중';
}

function mapCategory(cat: string): string {
  if (/자금|융자|대출|보험|보조금/.test(cat)) return '자금/인력';
  if (/창업|사업화|경진|스타트업|벤처/.test(cat)) return '사업화';
  if (/R&D|기술|연구|개발/.test(cat)) return 'R&D/기술';
  if (/수출|글로벌|해외/.test(cat)) return '수출/글로벌';
  if (/교육|멘토|컨설팅|인재/.test(cat)) return '교육/멘토링';
  if (/공간|시설|임대/.test(cat)) return '공간지원';
  return cat || '기타';
}

async function scrapeBizinfoGrants() {
  const BASE = 'https://www.bizinfo.go.kr';
  const { data: html } = await axios.get(`${BASE}/web/lay1/bbs/S1T122C128/AS/74/list.do`, {
    params: { searchEndAt: 'N', pageIndex: 1, pageUnit: 30 },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    timeout: 15000,
  });

  const $ = load(html);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 1);

  const grants: any[] = [];

  $('table tbody tr').each((idx: number, row: any) => {
    const tds = $(row).find('td');
    if (tds.length < 6) return;

    const category = $(tds.eq(1)).text().trim();
    const linkEl = $(tds.eq(2)).find('a').first();
    const href = linkEl.attr('href') ?? '';
    const title = linkEl.text().trim();
    const period = $(tds.eq(3)).text().trim();
    const govOrg = $(tds.eq(4)).text().trim();
    const performer = $(tds.eq(5)).text().trim();

    if (!title || !href) return;

    let deadline = '';
    const dateMatch = period.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      deadline = dateMatch[2];
    } else if (/상시/.test(period)) {
      deadline = '상시';
    }

    if (deadline && deadline !== '상시') {
      const deadlineDate = new Date(deadline);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate < cutoff) return;
    }

    const url = href.startsWith('http') ? href : `${BASE}${href}`;

    grants.push({
      id: String(idx + 1),
      title,
      agency: performer || govOrg,
      source: '기업마당',
      category: mapCategory(category),
      amount: '',
      deadline,
      status: computeStatus(deadline),
      url,
      target: '중소기업/스타트업',
      region: '전국',
    });
  });

  return grants;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Export Source Code Endpoint
  app.get("/api/download-source", (req, res) => {
    import("child_process").then(({ execSync }) => {
      try {
        const tarball = execSync("tar -czf - --exclude=node_modules --exclude=dist --exclude=.git .");
        res.setHeader("Content-Type", "application/gzip");
        res.setHeader("Content-Disposition", "attachment; filename=\"project-source.tar.gz\"");
        res.send(tarball);
      } catch (err) {
        console.error("Download Error:", err);
        res.status(500).send("Failed to archive the project.");
      }
    });
  });

  app.get("/api/grants", async (req, res) => {
    try {
      const grants = await scrapeBizinfoGrants();
      if (grants.length > 0) {
        res.json({ grants, source: 'live', lastUpdated: new Date().toISOString() });
        return;
      }
    } catch (err: any) {
      console.warn('Live scraping failed, using fallback:', err.message);
    }

    const fallbackGrants = [
      {
        id: '1',
        title: '2026년 올해의 K-스타트업 부처 통합 창업경진대회',
        agency: '창업진흥원',
        source: 'K-Startup',
        category: '사업화',
        amount: '상금 최대 5억원',
        deadline: '2026-08-31',
        status: '접수중',
        url: 'https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000120063',
        target: '초기창업(3년이내)',
        region: '전국',
      },
      {
        id: '2',
        title: '2026년 소상공인 고용보험료 지원사업',
        agency: '소상공인시장진흥공단',
        source: '소상공인24',
        category: '자금/인력',
        amount: '보험료의 50~80%',
        deadline: '2026-12-31',
        status: '접수중',
        url: 'https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000117022',
        target: '소상공인',
        region: '전국',
      },
      {
        id: '3',
        title: '2026년 소상공인 정책자금 융자사업',
        agency: '소상공인시장진흥공단',
        source: '소상공인24',
        category: '자금/인력',
        amount: '최대 7,000만원',
        deadline: '2026-12-31',
        status: '접수중',
        url: 'https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=310&bcIdx=1064354&parentSeq=1064354',
        target: '소상공인',
        region: '전국',
      },
      {
        id: '4',
        title: '2026년 올해의 K-스타트업 혁신창업리그',
        agency: '창업진흥원',
        source: 'K-Startup',
        category: '사업화',
        amount: '상금 및 후속 투자 연계',
        deadline: '2026-05-20',
        status: '마감',
        url: 'https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000121153',
        target: '초기창업(3년이내)',
        region: '전국',
      },
    ];

    res.json({ grants: fallbackGrants, source: 'fallback', lastUpdated: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
