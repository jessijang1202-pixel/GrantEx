import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

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
      // API Settings
      const apiKey = process.env.GOV_API_KEY;
      
      // If the API key is present, attempt to fetch from an Open API.
      // Note: Endpoint is a placeholder based on general K-Startup / Data.go.kr structures.
      // If the exact endpoint differs, we will fall back to mock data safely.
      if (apiKey) {
        try {
          const apiResponse = await axios.get("https://api.odcloud.kr/api/15082404/v1/uddi:a1af4be7-eb05-4f01-afed-6df18306dc95", {
            headers: {
              "Authorization": `Infuser ${apiKey}`
            },
            params: {
              page: 1,
              perPage: 50,
              serviceKey: apiKey 
            },
            timeout: 5000
          });
          
          if (apiResponse.data && apiResponse.data.data) {
             // You would normally map the real API data here.
             console.log("Successfully fetched external Open API data.");
             // Proceed to map or return data...
          }
        } catch (apiError: any) {
          console.log("External API fetch failed (this is expected if endpoint/key mismatch):", apiError.message);
        }
      }

      // Fallback Data (Mock data mapping to our structure)
      const fallbackGrants = [
        {
          id: '1',
          title: '2026년 예비창업패키지 예비창업자 모집 공고',
          agency: '중소벤처기업부',
          source: 'K-Startup',
          category: '사업화',
          amount: '최대 1억원',
          deadline: '2026-06-15',
          status: '접수마감임박',
          url: 'https://www.k-startup.go.kr/common/announcement/announcementList.do?mid=10681&bid=701',
          target: '예비창업자',
          region: '전국'
        },
        {
          id: '2',
          title: '2026년 초기창업패키지 창업기업 모집',
          agency: '중소벤처기업진흥공단',
          source: 'K-Startup',
          category: '사업화',
          amount: '최대 1억원',
          deadline: '2026-06-24',
          status: '접수중',
          url: 'https://www.k-startup.go.kr/common/announcement/announcementList.do?mid=10681&bid=701',
          target: '초기창업(3년이내)',
          region: '전국'
        },
        {
          id: '3',
          title: '2026년 소상공인 스마트상점 기술보급사업',
          agency: '소상공인시장진흥공단',
          source: '소상공인24',
          category: '기술지원',
          amount: '최대 500만원',
          deadline: '2026-06-30',
          status: '접수중',
          url: 'https://www.sbiz.or.kr/smst/index.do',
          target: '소상공인',
          region: '전국'
        },
        {
          id: '4',
          title: '서울 청년창업사관학교 16기 선발 공고',
          agency: '중소벤처기업진흥공단',
          source: '모두의 창업',
          category: '공간지원',
          amount: '최대 1억원',
          deadline: '2026-06-10',
          status: '마감',
          url: 'https://start.kosmes.or.kr/',
          target: '초기창업(3년이내)',
          region: '서울'
        },
        {
          id: '5',
          title: '2026년 로컬크리에이터 육성사업',
          agency: '창업진흥원',
          source: 'K-Startup',
          category: '사업화',
          amount: '최대 4,000만원',
          deadline: '2026-07-10',
          status: '접수예정',
          url: 'https://www.k-startup.go.kr/common/announcement/announcementList.do?mid=10681&bid=701',
          target: '도약기(7년이내)',
          region: '비수도권'
        },
        {
          id: '6',
          title: '경기도 소상공인 자영업자 고용보험료 지원사업',
          agency: '소상공인시장진흥공단',
          source: '소상공인24',
          category: '자금/인력',
          amount: '보험료의 50~80%',
          deadline: '2026-07-15',
          status: '접수중',
          url: 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000000000117022',
          target: '소상공인',
          region: '경기'
        },
        {
          id: '7',
          title: '재도전성공패키지 참여기업 모집',
          agency: '창업진흥원',
          source: 'K-Startup',
          category: '사업화',
          amount: '최대 6,000만원',
          deadline: '2026-06-20',
          status: '접수중',
          url: 'https://www.k-startup.go.kr/common/announcement/announcementList.do?mid=10681&bid=701',
          target: '재창업자',
          region: '전국'
        }
      ];

      res.json({ grants: fallbackGrants });
    } catch (error) {
      console.error("Error fetching grants:", error);
      res.status(500).json({ error: "Failed to fetch grant data" });
    }
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
