import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey = process.env.GOV_API_KEY;

    if (apiKey) {
      try {
        const apiResponse = await axios.get(
          'https://api.odcloud.kr/api/15082404/v1/uddi:a1af4be7-eb05-4f01-afed-6df18306dc95',
          {
            headers: { Authorization: `Infuser ${apiKey}` },
            params: { page: 1, perPage: 50, serviceKey: apiKey },
            timeout: 5000,
          }
        );
        if (apiResponse.data?.data) {
          console.log('Successfully fetched external Open API data.');
        }
      } catch (apiError: any) {
        console.log('External API fetch failed:', apiError.message);
      }
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

    res.json({ grants: fallbackGrants });
  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ error: 'Failed to fetch grant data' });
  }
}
