// monitor.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 모니터링할 게시판들
const BOARDS = [
  {
    name: '보도자료',
    url: 'https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS074&mCode=C020010000',
    icon: '📰',
    lastPostFile: 'last_post_news.txt'
  },
  {
    name: '안내서',
    url: 'https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS217&mCode=D010030000', 
    icon: '📋',
    lastPostFile: 'last_post_guide.txt'
  }
];

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

async function sendTeamsMessage(boardName, title, content, url, icon = "🔔") {
  const message = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": `개인정보보호위원회 새 ${boardName}`,
    "themeColor": "0078D4",
    "originator": "개보위 알림봇",
    "sections": [{
      "activityTitle": `${icon} 개인정보보호위원회 ${boardName} 업데이트`,
      "activitySubtitle": title,
      "activityImage": "https://cdn-icons-png.flaticon.com/512/3094/3094837.png",
      "text": content,
      "facts": [{
        "name": "게시판:",
        "value": boardName
      }, {
        "name": "확인 시간:",
        "value": new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      }, {
        "name": "모니터링 봇:",
        "value": "개보위 알림봇 🤖"
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

async function checkBoard(board) {
  try {
    console.log(`${board.name} 게시판 체크 시작...`);
    
    const response = await axios.get(board.url, {
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
      throw new Error(`${board.name} 게시판에서 게시글을 찾을 수 없습니다.`);
    }
    
    console.log(`${board.name} 최신 게시글: ${title} (${date})`);
    
    // 이전 체크 결과 읽기 (환경변수 사용)
    let lastTitle = '';
    const envVarName = board.name === '보도자료' ? 'LAST_POST_NEWS' : 'LAST_POST_GUIDE';
    
    try {
      if (fs.existsSync(board.lastPostFile)) {
        lastTitle = fs.readFileSync(board.lastPostFile, 'utf8').trim();
      }
    } catch (error) {
      console.log(`${board.name} 이전 기록 없음, 첫 체크입니다.`);
    }
    
    // 새 게시글 확인
    if (title !== lastTitle) {
      console.log(`${board.name}에서 새로운 게시글 발견!`);
      
      // Teams에 알림 전송
      const fullUrl = link ? `https://www.pipc.go.kr${link}` : board.url;
      await sendTeamsMessage(
        board.name,
        `새로운 ${board.name}이 게시되었습니다!`,
        `**${title}**\n\n게시일: ${date}`,
        fullUrl,
        board.icon
      );
      
      // 현재 게시글 제목 저장
      fs.writeFileSync(board.lastPostFile, title);
      console.log(`${board.name} 새 게시글 정보 저장 완료`);
      
      return true; // 새 게시글 있음
    } else {
      console.log(`${board.name} 새로운 게시글 없음`);
      return false; // 새 게시글 없음
    }
    
  } catch (error) {
    console.error(`${board.name} 체크 실패:`, error.message);
    
    // 에러 발생 시에도 Teams에 알림
    if (TEAMS_WEBHOOK_URL) {
      await sendTeamsMessage(
        board.name,
        `${board.name} 모니터링 오류 발생`,
        `오류 내용: ${error.message}`,
        board.url,
        "❌"
      );
    }
    return false;
  }
}

async function checkAllBoards() {
  console.log('전체 게시판 모니터링 시작...');
  
  let hasNewPosts = false;
  
  // 모든 게시판을 순차적으로 체크
  for (const board of BOARDS) {
    const result = await checkBoard(board);
    if (result) hasNewPosts = true;
    
    // 각 게시판 체크 사이에 1초 대기 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!hasNewPosts) {
    console.log('모든 게시판에서 새로운 게시글이 없습니다.');
  }
  
  console.log('전체 게시판 모니터링 완료');
}

// 스크립트 실행
checkAllBoards();
