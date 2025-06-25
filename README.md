# 개인정보보호위원회 알림봇 🤖

개인정보보호위원회의 **보도자료**와 **안내서** 게시판을 자동으로 모니터링하여 새 게시글이 올라오면 Microsoft Teams로 알림을 보내는 시스템입니다.

## 📋 모니터링 대상

- **📰 보도자료**: https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS074&mCode=C020010000
- **📋 안내서**: https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS217&mCode=D010030000

## ⏰ 실행 시간

**월요일~금요일 오전 9시** (한국시간) 자동 실행
- UTC 0시 = KST 9시
- 주말 및 공휴일 제외

## 🎯 동작 방식

1. **당일 게시된 글**만 확인 (과거 글 무시)
2. 새 글이 있으면 → **Teams 알림** 📢
3. 새 글이 없으면 → **조용함** 🤫
4. 에러 발생 시 → **에러 알림** ❌

## 📁 파일 구조

```
pipc-monitor/
├── .github/
│   └── workflows/
│       └── monitor-pipc.yml    # GitHub Actions 워크플로우
├── monitor.js                  # 웹사이트 모니터링 스크립트
└── README.md                   # 이 파일
```

## ⚙️ 초기 설정 (완료됨)

### 1. Teams Webhook URL 생성
1. Teams 채널에서 **앱** → **Incoming Webhook** 추가
2. 이름: "개인정보위 알림봇"
3. Webhook URL 복사

### 2. GitHub Secrets 설정
1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `TEAMS_WEBHOOK_URL`
4. Secret: Webhook URL 붙여넣기

### 3. Repository 설정
- **Public 저장소** (무료 Actions 무제한 사용)
- **Actions 권한**: Allow all actions

## 🚀 사용법

### 수동 실행
1. **Actions** 탭 클릭
2. **Monitor PIPC Website** 선택
3. **Run workflow** 버튼 클릭

### 자동 실행 확인
- 매일 오전 9시 후 **Actions** 탭에서 실행 기록 확인
- 새 게시글 있으면 Teams에 알림 도착

## 🛠️ 문제 해결

### Q: 자동 실행이 안 돼요
**A:** Actions 탭에서 확인사항:
- 워크플로우가 목록에 있는지
- "This scheduled workflow is disabled" 메시지가 없는지
- Private 저장소라면 Actions 무료 한도 초과 가능성

### Q: Teams 알림이 안 와요
**A:** 확인사항:
1. **Secrets 설정**: Repository → Settings → Secrets에 `TEAMS_WEBHOOK_URL` 있는지
2. **Webhook URL 유효성**: Teams에서 Webhook이 삭제되지 않았는지
3. **수동 실행 테스트**: Actions 탭에서 Run workflow로 테스트

### Q: "알 수 없는 사용자"로 나와요
**A:** Teams Webhook의 한계입니다. 메시지 내용에 봇 정보가 표시되니 실용적으로는 문제없습니다.

### Q: 중복 알림이 와요
**A:** 하루 1회만 실행되고, 당일 게시된 글만 체크하므로 중복 불가능합니다.

## 📊 모니터링 로그

### Actions 탭에서 볼 수 있는 정보:
- 실행 시간
- 각 게시판별 체크 결과
- 새 게시글 발견 여부
- 에러 발생 시 상세 내용

### 콘솔 출력 예시:
```
보도자료 게시판 체크 시작...
보도자료 최신 게시글: 개인정보보호법 시행령 개정안 행정예고 (2025-06-23)
보도자료에서 오늘 날짜의 새 게시글 발견!
보도자료 알림 전송 완료

안내서 게시판 체크 시작...
안내서 최신 게시글: 개인정보 처리방침 작성 가이드 (2025-06-20)
안내서 오늘 게시된 새 글 없음
```

## 🔧 수정/확장 방법

### 체크 시간 변경
`monitor-pipc.yml` 파일의 cron 설정 수정:
```yaml
# 현재: 평일 오전 9시
- cron: '0 0 * * 1-5'

# 다른 예시들:
- cron: '0 1 * * 1-5'    # 평일 오전 10시
- cron: '0 5 * * 1-5'    # 평일 오후 2시
- cron: '0 9 * * 1-5'    # 평일 오후 6시
```

### 게시판 추가
`monitor.js`의 `BOARDS` 배열에 추가:
```javascript
{
  name: '새게시판명',
  url: '새URL',
  icon: '🔖',
  lastPostFile: 'last_post_new.txt'  // 사용되지 않음
}
```

### 알림 메시지 변경
`sendTeamsMessage` 함수에서 메시지 내용 수정

## 💡 주의사항

1. **Webhook URL 보안**: Public 저장소이므로 반드시 Secrets 사용
2. **서버 부하**: 각 게시판 체크 사이 1초 대기 설정됨
3. **시간대**: 한국시간 기준으로 설정됨 (UTC+9)
4. **무료 한도**: Public 저장소는 Actions 무제한 무료

## 📞 문제 발생 시

1. **Actions 탭**에서 실행 로그 확인
2. **수동 실행**으로 문제 재현
3. **Secrets 설정** 재확인
4. **Webhook URL** 유효성 검사

---

**마지막 업데이트**: 2025-06-26
**생성자**: GitHub Actions 자동화
**상태**: 정상 운영 중 ✅
