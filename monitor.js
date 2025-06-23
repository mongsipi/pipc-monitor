// monitor.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const PIPC_URL = 'https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS074&mCode=C020010000';
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

async function sendTeamsMessage(title, content, url) {
  const message = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "개인정보보호위원회 새 보도자료",
    "themeColor": "0078D4",
    "originator": "개보위 알림봇",
    "sections": [{
      "activityTitle": "🔔 개인정보보호위원회 업데이트",
      "activitySubtitle": title,
      "activityImage": "https://cdn-icons-png.flaticon.com/512/3094/3094837.png",
      "text": content,
      "facts": [{
        "name": "확인 시간:",
        "value": new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      }, {
        "name": "모니터링 봇:",
        "value": "개인정보위 알림봇 🤖"
      }]
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "사이트 확인하기",
      "targets": [{
        "os": "default",
        "uri": url
      }]
    }]
  };

  try {
    await axios.post(TEAMS_WEBHOOK_URL, message);
    console.log('Teams 알림 전송 성공');
  } catch (error) {
    console.error('Teams 알림 전송 실패:', error.message);
  }
}

async function checkWebsite() {
  try {
    console.log('웹사이트 체크 시작...');
    
    const response = await axios.get(PIPC_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // 첫 번째 게시글의 제목과 날짜 추출
    const firstPost = $('table tbody tr').first();
    const title = firstPost.find('td').eq(1).text().trim(); // 제목
    const date = firstPost.find('td').eq(3).text().trim();  // 작성일
    const link = firstPost.find('td').eq(1).find('a').attr('href');
    
    if (!title) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    console.log(`최신 게시글: ${title} (${date})`);
    
    // 이전 체크 결과 읽기
    let lastTitle = '';
    try {
      if (fs.existsSync('last_post.txt')) {
        lastTitle = fs.readFileSync('last_post.txt', 'utf8').trim();
      }
    } catch (error) {
      console.log('이전 기록 없음, 첫 체크입니다.');
    }
    
    // 새 게시글 확인
    if (title !== lastTitle) {
      console.log('새로운 게시글 발견!');
      
      // Teams에 알림 전송
      const fullUrl = link ? `https://www.pipc.go.kr${link}` : PIPC_URL;
      await sendTeamsMessage(
        '새로운 보도자료가 게시되었습니다!',
        `**${title}**\n\n게시일: ${date}`,
        fullUrl
      );
      
      // 현재 게시글 제목 저장
      fs.writeFileSync('last_post.txt', title);
      console.log('새 게시글 정보 저장 완료');
      
    } else {
      console.log('새로운 게시글 없음');
    }
    
  } catch (error) {
    console.error('웹사이트 체크 실패:', error.message);
    
    // 에러 발생 시에도 Teams에 알림
    if (TEAMS_WEBHOOK_URL) {
      await sendTeamsMessage(
        '모니터링 오류 발생',
        `오류 내용: ${error.message}`,
        PIPC_URL
      );
    }
  }
}

// 스크립트 실행
checkWebsite();
